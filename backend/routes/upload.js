const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const router = require("express").Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

//이미지 파일 최대 용량 설정 후 임시로 저장할 공간을
//multer 패키지를 통해 사용
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  }, //5MB
});
const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  }, //50MB
});

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "인증되지 않은 요청입니다." });
  }
  next();
};
//이미지 라우터
router.post(
  "/image",
  verifyToken,
  imageUpload.single("image"),
  async (req, res) => {
    try {
      const file = req.file; //파일이 .jpg, .png 등 확장자명을 받아서 split으로 나눔
      const fileExtension = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`; //uuid로 랜덤한 파일명 생성

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `post-images/${fileName}`, //post-images 폴더에 저장
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-images/${fileName}`;
      res.json({ imageUrl });
    } catch (error) {
      console.log("이미지 업로드 오류: ", error);
      res
        .status(500)
        .json({ error: "이미지 업로드 중에 에러가 발생했습니다." });
    }
  }
);

//파일라우터
router.post(
  "/file",
  verifyToken,
  fileUpload.single("file"),
  async (req, res) => {
    try {
      const file = req.file; //파일이 .jpg, .png 등 확장자명을 받아서 split으로 나눔
      const originalname= req.file.originalname; //원본파일이름 보존
      const decodedfileName = decodeURIComponent(originalname);//오리지널 네임이 url인코딩된 상태 일수도 있어서 원래 문자열로 변환


      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `post-files/${decodedfileName}`, //post-images 폴더에 저장
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: `attchment; filename*=UTF-8''${encodeURIComponent(decodedfileName)}`, //다운로드시 원본파일이름으로 저장되도록
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-files/${decodedfileName}`;
      res.json({ fileUrl });
    } catch (error) {
      console.log("파일 업로드 오류: ", error);
      res
        .status(500)
        .json({ error: "파일 업로드 중에 에러가 발생했습니다." });
    }
  }
);

module.exports = router;