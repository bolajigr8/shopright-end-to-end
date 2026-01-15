import { useQuery } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import { Product } from '@/types'
import { AxiosError } from 'axios'

// export const useProduct = (productId: string) => {
//   const api = useApi();

//   const result = useQuery<Product>({
//     queryKey: ["product", productId],
//     queryFn: async () => {
//       const { data } = await api.get(`/products/${productId}`);
//       return data;
//     },
//     enabled: !!productId,
//   });

//   return result;
// };

export const useProduct = (productId: string) => {
  const api = useApi()

  return useQuery<Product, AxiosError<{ message: string }>>({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}`)
      return data
    },
    enabled: !!productId,
  })
}
