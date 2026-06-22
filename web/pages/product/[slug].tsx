import React from 'react'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r=>r.json())

export default function ProductPage({ query }) {
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : ''
  const { data } = useSWR(() => slug ? process.env.NEXT_PUBLIC_API_URL + `/products/slug/${slug}` : null, fetcher)

  if (!data) return <div>Loading...</div>

  const mainAsset = data.assets && data.assets[0]

  async function checkout(){
    try{
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/stripe/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: data.id }) })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        alert('Could not create checkout session')
        console.error(json)
      }
    } catch (e) {
      console.error(e)
      alert('Error creating checkout')
    }
  }

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
      {mainAsset ? <div style={{marginBottom:16}}><img src={mainAsset.url} alt={data.title} style={{maxWidth:420}} /></div> : <div>No model available</div>}
      <button onClick={checkout}>Buy — ${(data.priceCents/100).toFixed(2)}</button>
    </div>
  )
}
