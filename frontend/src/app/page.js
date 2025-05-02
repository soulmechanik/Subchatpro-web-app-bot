import React from 'react'
import Hero from '../components/Hero/Hero'
import Header from '../components/Header/Header'
import Footer from '@/components/Footer/Footer'
import HowItWorks from '../components/Howitworks/Howitworks'


const page = () => {
  return (
    <div>
      <Header/>
      <Hero/>

      <Footer/>
    </div>
  )
}

export default page