//dotenv 설치 완료
require("dotenv").config();
//mongoose 설치

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); //쿠키 파서 설치

const app = express();
const PORT = 3001;



//json을 해석할 수 있는 기능이 없어 500에러 발생, 따라서 npm 설치 = 
//순서상 라우팅 이전에 위치해야 함
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser()); //쿠키 파서 설치

const userRoutes = require("./routes/user.js");//이거 순서문제였당
app.use("/api/auth",userRoutes); // /user/signup -> /api/auth/signup 로 변경
//미들웨어 등록, json형태로 된 요청 바디를 파싱
//사용자가 3001번에 signup으로 post요청하면 index에서 요청이 도착하는데 api/auth라는 url을 인식한 뒤 userRoutes를 호출
//임시테스트 확장프로그램 thunder client 설치



app.get("/", (req, res) => {
  res.send("Hello world");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 와 연결이 되었습니다."))
  .catch((error) => console.log("MongoDB 연결에 실패했습니다: ", error));

app.listen(PORT, () => {
  console.log("Server is running");
});
