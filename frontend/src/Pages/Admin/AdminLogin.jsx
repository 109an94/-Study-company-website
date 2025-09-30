import React from "react";
import { useState } from "react";


const AdminLogin = () => {
    //초기값이라서 빈문자열
    const [formData, setFormData] = React.useState({
        username : '',
        password : '',
    });
    //
    const [error, setError] = React.useState('');
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

        <form className="mt-8 space-y-6">
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
                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                placeholder="관리자 비밀번호"
              />
            </div>
          </div>
            {/* from 데이터 안에 넣어서 반환해줘야함 */}
            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg text-base font-bold text-center">
                    {typeof error === "string"? error : error.message}
                    {/* 스트링이 아니면 json안에 있는 메세지 보여주는 필터링 */}
                    {error.remainingAttempts !== undefined && (
                        <div className="mt-1">
                            남은 시도 횟수 : {error.remainingAttempts} 회
                        </div>
                    )}
                </div>
            ) 
            }

            <button
            type="submit"
            className="w-full items-center px-4 py-3 border-transparent rounded-lg text-white
             bg-blue-600 hover:bg-blue-700 font-medium transition-colors duration-300">
            로그인
          </button>


        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
