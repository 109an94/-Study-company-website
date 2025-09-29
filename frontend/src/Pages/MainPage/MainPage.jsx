import React from 'react'
import Hero from './Hero'
import Contact from '../Contact/Contact'
import Forum from './Forum'
//메인페이지 안에 컴포넌트 3개 들어갈 예정
//근데 재사용할 일이 없어서 컴포넌트를 안만들고 그냥 jsx로 페이지를 만들 예정

//리액트 개발은 컴포넌트라는 부품을 만들어서
//페이지에 적절한 순서대로 배치후 랜더링을 시킨다음
// 라우팅을 통해 페이지를 이동하는 방식으로 이루어진다.

const MainPage = () => {
  return (
    <div>
      <Hero/>
      <Contact/>
      <Forum/>
    </div>
  )
}

export default MainPage
