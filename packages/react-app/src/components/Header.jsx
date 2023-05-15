import { PageHeader } from "antd";
import React from "react";
import hackathon from './hackathon.svg'

// displays a page header

export default function Header() {
  return (
    <div>
      <div style={{fontSize: 25, marginRight: 255, fontWeight: "bold"}}>Scaffold-ETH 2</div>
      <img src={hackathon} alt="hackathon" height={50} width={500} />
    </div>
  );
}
