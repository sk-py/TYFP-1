import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EditorPages from "./pages/EditorPages";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./SocketProvider";

function App() {
  return (
    <>
      <div>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              them: {
                primary: "#5a36c0",
              },
            },
          }}
        ></Toaster>
      </div>

      <BrowserRouter>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor/:roomId" element={<EditorPages />} />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
