import React from 'react'
import useSWR from 'swr'
import ProductViewer from '../../components/ProductViewer'

const fetcher = (url) => fetch(url).then(r=>r.json())

export default function ProductPage({ query }) {
  // Using query param via window for simplicity in this scaffold
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : ''
  const { data } = useSWR(() => slug ? process.env.NEXT_PUBLIC_API_URL + `/products/slug/${slug}` : null, fetcher)

  if (!data) return <div>Loading...</div>

  const mainAsset = data.assets && data.assets[0]

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {mainAsset ? <ProductViewer url={mainAsset.url} /> : <div>No model available</div>}
    </div>
  )
}
