const express = require("express"); //익스프레스 설치
const router = express.Router(); //라우터 기능을 담은 객체 생성
const bcrypt = require("bcrypt"); //비밀번호 암호화 위한 bcrypt 설치
const User = require("../models/User"); //유저 모델 가져오기
const axios = require("axios"); //ip 어드레스 가져오기 위한 axios 설치
const jwt = require("jsonwebtoken"); //jwt 설치

//req로 받아서 res로 응답
router.post("/signup", async (req, res) => {
  //중괄호 사용한 이유는 비동기 처리 위해
  try {
    const { username, password } = req.body;

    //몽고db 조회해서 중복 확인 (비동기로 처리)
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "이미 존재하는 사용자 이름입니다." });
      //중복이면 엔드포인트 요청 종료
      //서버에서 직접 400에러 응답
    }
    //password 해싱, 암호화 (보안 위해)
    //서브파티 활용 패키지 설치 필요, bcryptjs 설치
    const hashedPassword = await bcrypt.hash(password, 10); //해시함수를 통해 10진수 암호화
    const user = new User({
      username,
      password: hashedPassword,
    });
    await user.save(); //몽고디비의 함수 활용해 몽고디비에 저장
    res.status(201).json({ message: "회원가입이 완료되었습니다." }); //성공적으로 생성됐다는 응답
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
    console.log("회원가입 중 오류 발생: ", error); // 백엔드 콘솔에서 확인
  }
}); //회원가입 을 구현할 수 있게 엔드포인트 생성

//새로운 로그인 엔드포인트 생성
router.post("/login", async (req, res) => {
  try {
    //json에서 키값을 가져오는 것
    const { username, password } = req.body;
    //몽고db 서버에서 사용자 이름 조회
    const user = await User.findOne({ username }) //해당 함수를 사용
      .select("+password"); //비밀번호까지 가져오는 쿼리문 작성
    console.log(user);

    if (!user) {
      //유저가 없으면?
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (!user.isActive) {
      //유저가 비활성화 된 상태면?
      return res
        .status(401)
        .json({ message: "비활성화된 사용자입니다. 관리자에게 문의하세요." });
    }

    if (user.isLoggedIn) {
      return res
        .status(401)
        .json({ massege: "이미 다른 기기에서 로그인되어 있습니다." });
    }
    //클라이언트로 받은 password와 db에 저장된 (해싱된) 비밀번호 비교해서 검증하기
    const isValiedPassword = await bcrypt.compare(password, user.password); //클라이언트 pw , db pw
    if (!isValiedPassword) {
      user.failedLoginAttempts += 1; //로그인 시도 횟수 증가
      user.lastLoginAttempt = new Date(); //마지막 로그인 시도 시간 기록

      if (user.failedLoginAttempts >= 5) {
        user.isActive = false; //계정 비활성화
        await user.save(); //db에 실시간 업데이트
        return res.status(401).json({
          message: "비밀번호를 5회 이상 틀려 계정이 비활성화되었습니다.",
        });
      }

      await user.save(); //db에 실시간 업데이트
      return res.status(401).json({
        message: "비밀번호가 올바르지 않습니다.",
        remainingAttempts: 5 - user.failedLoginAttempts,
      }); //비밀번호 틀렸을 때
    }

    //로그인 성공시 시도횟수 초기화
    user.failedLoginAttempts = 0;
    user.lastLoginAttempt = new Date();
    user.isLoggedIn = true; //로그인 상태 true로 변경
    //+ip 어드레스도 저장하기 -> axios패키지를 활용

    //잠깐 주석처리
    // try {
    //   const response = await axios.get("https://api.ipify.org?format=json");
    //   const ipAddress = response.data.ip;
    //   user.ipAddress = ipAddress; //ip어드레스 저장
    // } catch (error) {
    //   console.log("IP 주소를 가져오는 중 오류 발생: ", error.message);
    // }

    await user.save(); //db에 실시간 업데이트

    //jwt 토큰 생성
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET, //환경변수에 시크릿키 가져오기
      { expiresIn: "24h" } //24시간 유효 - 해당 시간 후에는 토큰 사용이 불가능하게 됨
    ); //몽고db에 저장된 유저 정보로 토큰 생성

    console.log(token); //**확인용
    //토큰을 클라이언트 쿠키에 저장
    res.cookie("token", token, {
      httpOnly: true, //자바스크립트에서 쿠키 접근 불가
      secure: "production", //https 환경에서만 쿠키 전송
      sameSite: "strict", //크로스 사이트 요청 제한
      maxAge: 24 * 60 * 60 * 1000, //24시간
    });

    //클라이언트에게는 비밀번호 빼고 전송 , 누락한체 송부
    const userWithoutPassword = user.toObject(); //일반 object형태로 변환
    delete userWithoutPassword.password; //비밀번호 삭제

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.log("로그인 중 오류 발생: ", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

//로그아웃 엔드포인트 생성
router.post("/logout", async (req, res) => {
  try {
    //클라이언트가 서버측으로 쿠키를 전달해줘야 함
    const token = req.cookies.token; //쿠키 추출
    if (!token) {
      //만약 쿠키가 없다면?
      return res.status(400).json({ message: "이미 로그아웃된 상태입니다." });
    }
    // let user = null; //추가
    try {
      //토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //토큰안에는 유저ID 와 유저NAME이 들어가져 있음 그래서 그것을 추출
      const user = await User.findById(decoded.userId); //함수 내부의 mongodb id를 가져오기
      if (user) {
        //유저가 실존한다면
        user.isLoggedIn = false; //로그인 상태 false로 변경
        await user.save(); //db에 실시간 업데이트
      }
    } catch (error) {
      console.log("토큰 검증 중 오류 발생: ", error.message);
    }

    //쿠키 삭제
    res.clearCookie("token", {
      httpOnly: true,
      secure: "production",
      sameSite: "strict", //크로스 사이트 요청 제한
    });

    res.json({ message: "로그아웃 되었습니다." });
    //express에서 쿠키를 못 읽어서 cookie-parser 설치
  } catch (error) {
    console.log("로그아웃 오류: ", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/delete/:userId", async (req, res) => {
  try {
    //몽고db에서 사용자 삭제 하는 스키마가 있음
    const user = await User.findByIdAndDelete(req.params.userId); //url 파라미터로 userId를 받아서 삭제
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json({ message: "사용자가 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});


router.post("/verify-token", (req,res)=>{
  const token = req.cookies.token;
  if(!token){
    return res.status(400).json({ isVailed: false , message: "토큰이 없습니다."});
  }

  try {
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    return res.status(200).json({ isValied: true, user:decoded})
  } catch (error) {
    return res.status(401).json({isVailed:false, message: "토큰이 유효하지 않습니다."});
  }
})

//라우터를 외부로 추출
module.exports = router; //-> indexjs로 이동
