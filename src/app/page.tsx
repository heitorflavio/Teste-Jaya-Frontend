import LoginC from '@/components/PaymentComponent/index';
import { Toaster } from "react-hot-toast";

const Payment = () => {
  return (
    <div>
      <Toaster position="top-center" />
      <LoginC />
    </div>
  );
};

export default Payment;