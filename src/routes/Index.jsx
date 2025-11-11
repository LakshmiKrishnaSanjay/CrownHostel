
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "../pages/guest/Signin";
import Payment from "../pages/user/Payment";

import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Payments from "../pages/admin/Payments";
import Reports from "../pages/admin/Reports";
import AddRoom from "../pages/admin/AddRoom";
import ViewRooms from "../pages/admin/ViewRooms";
import RegisterHostler from "../pages/admin/RegisterHostler";
import ViewHostlers from "../pages/admin/ViewHostlers";
import ProtectedRoute from "../middleware/ProtectedRoute";
import PaymentsList from "../pages/admin/paymentsList";
import PaymentDetails from "../pages/admin/paymentDetails";
import PendingPayments from "../pages/admin/PendingPayments";
import EditRoom from "../pages/admin/EditRoom";
import EditHostler from "../pages/admin/EditHostler";
import PaymentHistory from "../pages/admin/PaymentHistory";




export default function Index() {
  return (
    <BrowserRouter>
      <Routes>
        
{/*user*/}
          <Route path="/" element={<SignIn/>}/>
          <Route path="/payment" element={<Payment />}/>


        {/* Admin routes */}



        <Route
        path="/admin"
        element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
          </ProtectedRoute> } >

          <Route index element={<Dashboard />} />           {/* default /admin */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="addroom" element={<AddRoom />} />
          <Route path="viewroom" element={<ViewRooms/>} />
          <Route path="registerhostlers" element={<RegisterHostler />} />
          <Route path="viewhostlers" element={<ViewHostlers />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="paymentlist" element={<PaymentsList />} />
          <Route path="paymentDetails/:id" element={<PaymentDetails />} />
          <Route path="pendingpayments" element={<PendingPayments />} />
          <Route path="edit-room/:id" element={<EditRoom/>}/>
          <Route path="edit-hostler/:id" element={<EditHostler />} />
          <Route path="payment-history/:hostlerId" element={<PaymentHistory />} />


        </Route>



          
      </Routes>
    </BrowserRouter>
  );
}