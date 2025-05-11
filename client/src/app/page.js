'use client'
import React, { useEffect, useState } from "react"

export default function Home() {

  useEffect(() => {
    fetch("/birds")
      .then((r) => r.json())
      .then((birdsArray) => {
        console.log("birds:", birdsArray);
      });
  }, []);

  return (
    <div>
      Hello from page
    </div>
  )

}
