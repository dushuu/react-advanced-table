import { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import type { AxiosResponse } from "axios";

export function useApi<T>(
  url: string,
  method: "GET" | "POST" = "GET",
  payload?: any
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        let response: AxiosResponse<any, any>;

        if (method === "GET") {
          response = await axiosInstance.get(url);
        } else {
          response = await axiosInstance.post(url, payload);
        }

        if (isMounted) {
          setData(response.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, method, payload]);

  return { data, loading, error };
}
