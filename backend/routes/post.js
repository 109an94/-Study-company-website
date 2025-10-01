const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { marked } = require("marked");

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};

//post endpoint
router.post("/", /*authenticateToken,*/ async (req, res) => {
  try {
    const { title, content, fileUrl } = req.body;
    const latestPost = await Post.findOne().sort({ number: -1 }); //내림차순으로 정렬, 게시물 번호가 최신인 순으로
    const nextNumber = latestPost ? latestPost.number + 1 : 1; //lastpost의 마지막 번호가 없으면 첫번째 게시글이 되고, 있으면 게시물 생성시 마지막 +1

    const post = new Post({
      number: nextNumber,
      title,
      content,
      fileUrl,
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

//전체게시물 get
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    //ip 검증
    let ip;
    try {
      const response = await axios.get("https://api.ipify.org?format=json");
      ip = response.data.ip;
    } catch (error) {
      console.log("IP 주소를 가져오는 중 오류 발생: ", error.message);
      ip = req.ip;
    }

    const userAgent = req.headers["user-agent"];

    //하루에 한번만 조회수 증가
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hasRecentView = post.viewLogs.some(
      (log) =>
        log.ip === ip &&
        log.userAgent == userAgent &&
        new Date(log.timestamp) > oneDayAgo
    );

    if (!hasRecentView) {
      post.view += 1;
      post.viewLogs.push({
        ip,
        userAgent,
        timestamp: new Date(),
      });
      await post.save;
    }

    let htmlContent;
    try {
      htmlContent = marked.parse(post.content || ""); //내용이 없으면 빈칸
    } catch (error) {
      console.log("마크다운 변환 중 오류 발생: ", error.message);
      htmlContent = post.content; //변환 실패시 원본 내용
    }

    //responsedata를 다시 정의 , 마크다운에서 html컨텐츠가 post내용에 포함해야해서
    const responseData = {
      ...post.toObject(), //mongoose document를 일반 객체로 변환
      renderedContent: htmlContent, //새로운 필드 추가
    };

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, content, fileUrl } = req.body;
    //바뀐 값이 있는 지 가져와서 판단

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }


    //확장자 정보 포함
    const imgRegex =
      /https:\/\/[^"']*?\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)/g;
      //원본 게시물의 콘텐츠와 새로운 콘텐츠에서 이미지 URL 추출
      const oldContentImages = post.content.match(imgRegex) || [];

    const newContentImages = content.match(imgRegex) || [];
    //삭제된 이미지 필터링
    //기존 콘텐츠에는 있지만 새로운 콘텐츠에는 없는 이미지 URL 찾기
    const deletedImages = oldContentImages.filter(
      (url) => !newContentImages.includes(url)
    );
    const deletedFiles = (post.fileUrl || []).filter(
      (url) => !(fileUrl || []).includes(url)
    );

    const getS3KeyFromUrl = (url, folder) => {
      try {
        //이미지 주소만으론 삭제 불가해서 오브젝트 추출 후 삭제 코드 송신
        const urlObj = new URL(url);
        return decodedURIComponent(urlObj.pathname.substring(1)); //앞에 / 제거
      
      } catch (error) {
        console.log("URL 파싱 오류: ", error.message);
        return null;
      }
    }
    //수정도니 이미지 있는 지 필터링
    const allDeletedFiles = [...deletedImages, ...deletedFiles];
    //포문 실행해서 한번에 삭제
    for(const fileUrl of allDeletedFiles){
      //하나씩 실제로 s3에서 삭제
      const key = getS3KeyFromUrl(fileUrl);
      if(key){
          console.log(`S3에서 파일 삭제 성공: ${key}`);
        try {
          await S3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          }))
        } catch (error) {
          console.log("S3에서 파일 삭제 실패: ", error.message);
        }

      }
    }

    post.title = title;
    post.content = content;
    post.fileUrl = fileUrl;
    post.updatedAt = Date.now();
    //바뀐게 없으면 그대로 저장
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id); //id로 특정값조회
    
    if (!post) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
    const imgRegex = /https:\/\/[^"']*?\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)/g;
    const contentImages = post.content.match(imgRegex) || [];


    
    const getS3KeyFromUrl = (url) => {
      try {
        //이미지 주소만으론 삭제 불가해서 오브젝트 추출 후 삭제 코드 송신
        const urlObj = new URL(url);
        return decodedURIComponent(urlObj.pathname.substring(1)); //앞에 / 제거
      
      } catch (error) {
        console.log("URL 파싱 오류: ", error.message);
        return null;
      }
    }


    const allFiles = [...contentImages, ...(post.fileUrl || [])]; //게시물에 포함된 모든 이미지와 파일 URL
    for(const fileUrl of allFiles){
      const key = getS3KeyFromUrl(fileUrl);
      if(key){
        
          console.log(`S3에서 파일 삭제 성공: ${key}`);
        try {
          await S3Client.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          }))
        } catch (error) {
          console.log("S3에서 파일 삭제 실패: ", error.message);
        }

      }
    }


    await post.deleteOne();
    res.json({ message: "게시글이 삭제가 되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router; //만든 엔드포인트를 외부에서 쓸 수 있도록
