import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ZAxis } from 'recharts';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Custom Y-axis tick component
  const CustomYAxisTick = (props) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#666">
          ${payload.value.toLocaleString()}
        </text>
      </g>
    );
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="hover-tooltip">
          Click for details
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/border_complaints.csv');
        const csvText = await response.text();
        
        // Store column name in a variable to avoid special characters
        const priceColumn = "price to be smuggled into U.S. (USD)";
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = results.data
              .filter(row => row.date && row[priceColumn])
              .map((row, index) => {
                // Extract year from date
                const dateStr = String(row.date || "");
                let year = 2020; // Default value
                
                if (dateStr.includes('/')) {
                  const parts = dateStr.split('/');
                  if (parts.length === 3) {
                    year = parseInt(parts[2], 10);
                  }
                } else if (dateStr.includes('-')) {
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                    year = parseInt(parts[0], 10);
                  }
                }
                
                // Process price - simplified
                let price = row[priceColumn];
                if (typeof price === 'string') {
                  // Simplified string replacement
                  price = price.replace('$', '').replace(',', '');
                  price = parseFloat(price);
                }
                
                if (year && !isNaN(price)) {
                  return {
                    id: index,
                    year: year,
                    price: price,
                    date: row.date || "Unknown date",
                    narrative: row.narrative || "No narrative provided",
                    source: row.source || null
                  };
                }
                return null;
              })
              .filter(item => item !== null);
            
            setData(processedData);
            setLoading(false);
          },
          error: (error) => {
            setError(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          }
        });
      } catch (error) {
        setError(`Error loading file: ${error.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading-container">Loading data...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Border Smuggling Price Analysis</h1>
      </header>
      <main className="App-main">
        <div className="visualization-container">
          <h2 style={{ textAlign: 'center' }}>The cost of being smuggled into the U.S. from Mexico</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart
                margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="year" 
                  name="Year" 
                  allowDecimals={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="price" 
                  name="Price"
                  tick={<CustomYAxisTick />}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter 
                  data={data} 
                  fill="#8884d8" 
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="visualization-footer">
            <p>Data visualization of border smuggling prices over time</p>
            <p>Total data points: {data.length}</p>
          </div>
        </div>
      </main>
      <footer className="App-footer">
        <p>Data compiled manually by Luke Harold</p>
      </footer>
    </div>
  );
}

export default App;
