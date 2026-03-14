"use client"

import Link from "next/link"
import { useState } from "react"

export default function SignupPage(){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const handleSignup = (e:any)=>{
    e.preventDefault()
    console.log(name,email,password)
  }

  return(

    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D111A]">

      {/* RiskLens Heading */}
      <h1 className="text-3xl font-semibold mb-8 text-[#7C8CFF]">
        RiskLens
      </h1>

      <form
      onSubmit={handleSignup}
      className="bg-[#1A2236] p-10 rounded-xl w-[380px] shadow-lg text-white">

        <h1 className="text-2xl font-bold text-center mb-8">
          Sign Up
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full border-b border-gray-600 mb-6 outline-none py-2 bg-transparent"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full border-b border-gray-600 mb-6 outline-none py-2 bg-transparent"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full border-b border-gray-600 mb-8 outline-none py-2 bg-transparent"
        />

        <button
        className="w-full py-3 text-white font-medium rounded
        bg-gradient-to-r from-blue-500 to-purple-600">
          Create Account
        </button>

        <p className="text-sm text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400">
            Login
          </Link>
        </p>

      </form>

    </div>

  )
}