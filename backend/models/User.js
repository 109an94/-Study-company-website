const mongoose = require("mongoose");
const { Schema } = mongoose;
//유저들의 정보를 담을 스키마 생성
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true, //필수 여부
      trim: true, //회원가입되면 "  admin " 이런식으로 공백 발생 시"admin" 으로 바꿔줌
      minlength: 2,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      select: false, //기본적으로 쿼리 결과에 비밀번호는 조회되지 않도록 설정
    },
    isLoggedIn: {
      type: Boolean, //로그인 상태를 나타내는 필드 , 만약 true라면 다른 쪽에서 로그인 불가
      default: false,
    },
    isActive: {
      type: Boolean, //회원 탈퇴 여부 or 계정 잠김를 나타내는 필드
      default: true, //기본값은 true 로그인 가능한 상태, 탈퇴시 false로 변경
    },
    failedLoginAttempts: {
      type: Number, //로그인 시도 횟수를 기록하는 필드
      default: 0, //기본값은 0
    },
    lastLoginAttempt: {
      type: Date, //마지막 로그인 시도 시간을 기록하는 필드
    },
    ipAddress: {
      type: String, //사용자의 IP 주소를 기록하는 필드
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, //회원가입 날짜 (지정하지 않았으면 지금으로 저장)
    },
  },
  {
    timestamps: true, //createdAt, updatedAt 자동 생성
  }
);

//User 모델 생성 (스키마를 모델로 감싸서 사용)
//첫번째 인자는 모델 이름, 두번째 인자는 스키마
//이 모델을 통해 몽고디비의 users 컬렉션에 접근 가능
const User = mongoose.model("User", userSchema);

//외부로 추출
module.exports = User;