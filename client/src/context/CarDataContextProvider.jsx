import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';

const CarDataContext = React.createContext();

function CarDataContextProvider( { children } ) {
    const [carData, setCarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

console.log(carData)
    useEffect(() => {
        fetch('/api/vin_history')
            .then(resp => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw new Error("Failed to fetch VIN history.");
                }
            })
            .then(car => {
                setCarData(car);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [])

    return (
        <CarDataContext.Provider value={{ carData, setCarData, loading, error}}>
            {children}
        </CarDataContext.Provider>
    )

}

CarDataContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export { CarDataContext, CarDataContextProvider };
