import React from "react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; //로그인 성공시 페이지 이동을 위해 필요

const AdminLogin = () => {
  //초기값이라서 빈문자열
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  //
  const [error, setError] = useState("");

  const navigate = useNavigate(); //페이지 이동을 위해 필요
  //객체로 담아서 보내줘야함
  //백엔드로 보내는 요청이니까 비동기 함수로 만들어줘야함

  const handleChange = (e) => {
    setFormData({
      ...formData, //기존의 formdata를 복사하게 됨.
      [e.target.name]: e.target.value, //name이 username이든 password든 바뀌게 됨
    });
    console.log(formData); //실시간으로 바뀌는 값 확인 가능
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3001/api/auth/login",
        formData, //쿠키값도 보내줘야 함.
        {
          withCredentials: true, //쿠키값을 프론트에서 백으로 보낼 수 있게 해줌
        }
      );
      if (response.data.user) {
        navigate("/admin/posts"); //로그인 성공시 대시보드 페이지로 이동
      }
    } catch (error) {
      const errorMessage =
        error.response.data.message || "로그인에 실패했습니다.";
      const remainingAttempts = error.response.data.remainingAttempts;

      setError({
        message: errorMessage,
        remainingAttempts: remainingAttempts,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-semibold text-gray-900">
            관리자 로그인
          </h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            관리자 전용 페이지입니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xm font-medium text-gray-700"
              >
                관리자 아이디
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                placeholder="관리자 아이디"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xm font-medium text-gray-700"
              >
                관리자 비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                placeholder="관리자 비밀번호"
              />
            </div>
          </div>
          {/* from 데이터 안에 넣어서 반환해줘야함 */}
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-base font-bold text-center">
              {typeof error === "string" ? error : error.message}
              {/* 스트링이 아니면 json안에 있는 메세지 보여주는 필터링 */}
              {error.remainingAttempts !== undefined && (
                <div className="mt-1">
                  남은 시도 횟수 : {error.remainingAttempts} 회
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full items-center px-4 py-3 border-transparent rounded-lg text-white
             bg-blue-600 hover:bg-blue-700 font-medium transition-colors duration-300"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
