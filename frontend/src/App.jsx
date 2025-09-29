import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter } from "react-router-dom";


function App() {
  return (
  // <h1 className="text-4xl font-bold underline text-red-500">
  //   Hello world!
  //   </h1>
  <BrowserRouter>
      <Navbar />
  </BrowserRouter>
    )
}

export default App;
