import React from 'react'

const Pagination = ({ page,setPage,count,pageSize = 10}) => {
    const totalPage = Math.ceil(count/pageSize);

    if (totalPage <= 1) return null;
   
  return (
    <div className="flex justify-center gap-2 mt-6">
        <button
          disabled={page === 1}
          onClick={()=>setPage(page -1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
          >
          Prev
        </button>

        <span className='px-3 py-2 text-sm'>
            Page {page} of {totalPage}
        </span>

        <button
          disabled={page === totalPage}
          onClick={()=>setPage(page +1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
          >
          Next
        </button>
    </div>
  )
}

export default Pagination