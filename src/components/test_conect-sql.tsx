import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'https://r2-api.sharkeatrice.workers.dev';

const TestConectSql = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${API_BASE_URL}/don-thue`);
            const result = await response.json();
            setData(result);
            console.log(result);
        };
        
        fetchData();
    }, []);

    return (
        <div>
            <h2>Test Database Connection</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default TestConectSql;