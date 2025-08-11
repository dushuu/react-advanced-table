import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import TablePage from "./pages/TablePage";
import "./index.css";
import PaginatedTable from "./pages/searching-table";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="table" element={<TablePage />} />
          <Route path="searching" element={<PaginatedTable />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
