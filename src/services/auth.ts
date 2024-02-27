import axios from 'axios';

export const authenticate = async (email: string, password: string) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_SERVER_URL_LOGIN}`,
    {
        email: email,
        password: password,
      
    },
  );
  const response = {
    token: res.data.token,
    data: res.data,
  };

  return response;
};