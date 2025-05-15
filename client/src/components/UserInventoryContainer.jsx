import React from "react";
import CompletedInventories from "./CompletedInventories";
import InventoryForm from "./InventoryForm";


export default function UserInventoryContainer() {

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* <InventoryForm /> */}
            <h1>Hello from the ral</h1>
            <CompletedInventories />
        </div>
    )
}