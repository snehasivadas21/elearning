import React from 'react'

const CheckEmail = () => {
  return (
    <div className='h-screen flex items-center justify-center bg-gray-100'>
        <div className='bg-white p-8 rounded-xl shadow-md text-center max-w-md'>
            <h2 className='text-2xl font-bold mb-2'>Check your Email</h2>
            <p className='text-gray-600'>
                We've sent you a verification link.
                <br />
                Please verify your email before logging in.

            </p>

        </div>

    </div>
  )
}

export default CheckEmail