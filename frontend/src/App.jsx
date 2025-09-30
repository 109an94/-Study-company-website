import "./App.css";
import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";
import React, { useEffect, useState } from "react";

import MainPage from "./Pages/MainPage/MainPage";
import About from "./Pages/About/About";
import Leadership from "./Pages/Leadership/Leadership";
import Board from "./Pages/Board/Board";
import Services from "./Pages/Services/Services";
import Contact from "./Pages/Contact/Contact";

import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminPosts from "./Pages/Admin/AdminPosts";


// import { BrowserRouter } from "react-router-dom";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";


function AuthRedirectRoute(){
  const [isAutenticated, setIsAuthenticated] = useState(null); 
  useEffect(()=>{
    const verifyToken = async()=>{
      try {
        const response = await axios.post("http://localhost:3001/api/auth/verify-token",
          {}, 
          { withCredentials: true }
        );
        setIsAuthenticated(true);
      } catch(error){
        console.log("토큰 인증 실패: ", error);
        setIsAuthenticated(false);
      }
    };
    verifyToken();
  },[]); //상태 변화가 일어나기 때문에 useeffect 를 사용
  //function이 끝나기 전에 null이면 함수 종료하도록
  if(isAutenticated === null){
    return null;
  }
  return isAutenticated ? <Navigate to="/admin/posts" replace/> : <Outlet/>;
  //이전 페이지로 못 돌아가게 replace 사용
  //실패하면 outlet써서 다시 로그인 페이지로 이동 됨
}

//리액트라우터 돔 사용 BrowserRouter -> createrbrowserrouter routerprovider outlet을 사용
//BrowserRouter는 라우터를 감싸주는 역할
//라우터란 무엇인가? 사용자가 요청한 URL에 따라 적절한 컴포넌트를 렌더링해주는 역할
//createrbrowserrouter는 라우팅 경로를 생성하는 역할 
//routerprovider는 라우터를 제공하는 역할
//outlet은 라우터의 자식 컴포넌트를 렌더링하는 역할.
function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout/>,
    children: [
      {
        index: true,
        element: <MainPage/>
      },
      {
        path: "/about",
        element: <About/>
      },
      {
        path: "/leadership",
        element: <Leadership/>
      },
      {
        path: "/board",
        element: <Board/>
      },
      {
        path: "/our-services",
        element: <Services/>
      },
      {
        path: "/contact",
        element: <Contact/>
      }
    ]
  },
  {//새로운 루트 추가
    path: "/admin",
    element: <AuthRedirectRoute/> ,
    //토큰을 가진 상태에서 ADMINLOGIN되면 자동 POSTS로 리다이렉트 되도록 함
    children:[{index: true, element:<AdminLogin/>}]
  },
  {
    path: "/admin",
    element: <AdminLayout/>,
    children:[
      {
        path: "posts",
        element: <AdminPosts/>
      }
    ]
  }
])

function App() {
  // return (
  // <BrowserRouter>
  //     <Navbar />
  //     <Footer />
  // </BrowserRouter>
  //   );
  // app 수정해서 라우터 프로아비더로 변경
  return <RouterProvider router={router}/>;
}
// /경로에 사용자가 접근하면 layout이 랜더링 되면서 보여지게 됨
// 그럼 네비, 아울렛, 푸터가 보이게 됨
// 여기서 index의 true는 기본 경로를 의미
// 즉 /경로에 접근했을 때 보여줄 컴포넌트를 지정하는 것
// element는 렌더링할 컴포넌트를 지정하는 것
// MainPage 컴포넌트가 렌더링 됨
//아울렛의 자식요소는 mainpage인데
//이 mainpage 컴포넌트가 아울렛 자리에 렌더링 되는 것
//즉 네비, 메인페이지, 푸터가 보이게 되는 것
//코스트가 적게 드는 이유는
//네비와 푸터는 모든 페이지에서 공통적으로 사용되기 때문에
//한번만 렌더링 되면 되기 때문
//따라서 메인페이지 컴포넌트만 바뀌게 되는 것
//이렇게 하면 성능이 좋아짐
//라우터를 사용하면 페이지 전환이 부드러워지고 빠르게 됨
//사용자가 원하는 페이지로 빠르게 이동할 수 있음
//또한 라우터를 사용하면 코드가 더 깔끔해지고 유지보수가 쉬워짐
//각 페이지를 컴포넌트로 분리해서 관리할 수 있기 때문
//따라서 리액트 라우터 돔을 사용하는 것이 좋음
export default App;
