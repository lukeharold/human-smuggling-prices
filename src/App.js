import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

// Sample data - no CSV parsing
const sampleData = [
  { year: 2010, price: 5000 },
  { year: 2012, price: 7000 },
  { year: 2015, price: 9000 },
  { year: 2018, price: 12000 },
  { year: 2020, price: 15000 },
];

function App() {
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
              <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="year" name="Year" />
                <YAxis type="number" dataKey="price" name="Price" />
                <Scatter data={sampleData} fill="#8884d8" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="visualization-footer">
            <p>Static sample visualization</p>
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
