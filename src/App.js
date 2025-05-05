import React, { useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ZAxis, Tooltip } from 'recharts';
import Papa from 'papaparse';
import './BorderSmugglingVisualization.css';

const BorderSmugglingVisualization = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/border_complaints - Form Responses.5.3.2025.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = results.data
              .filter(row => row.date && row["price to be smuggled into U.S. (USD)"])
              .map((row, index) => {
                // Extract year from date
                const dateStr = String(row.date);
                let year;
                
                if (dateStr.includes('/')) {
                  const parts = dateStr.split('/');
                  if (parts.length === 3) {
                    year = parseInt(parts[2]);
                  }
                } else if (dateStr.includes('-')) {
                  const parts = dateStr.split('-');
                  if (parts.length === 3) {
                    year = parseInt(parts[0]);
                  }
                }
                
                // Process price
                let price = row["price to be smuggled into U.S. (USD)"];
                if (typeof price === 'string') {
                  price = price.replace(/[$,]/g, '');
                  price = parseFloat(price);
                }
                
                if (year && !isNaN(price)) {
                  return {
                    id: index,
                    year: year,
                    price: price,
                    date: row.date,
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
    
    // Add document click handler to close tooltip when clicking outside
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.recharts-dot') && !e.target.closest('.detailed-tooltip')) {
        setTooltipInfo(null);
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  // Calculate optimal tooltip position
  const calculateTooltipPosition = (x, y) => {
    if (!chartContainerRef.current) return { left: x, top: y - 150 };
    
    const chartRect = chartContainerRef.current.getBoundingClientRect();
    const tooltipWidth = 300; // Max width of our tooltip
    const tooltipHeight = 250; // Approximate height of tooltip
    
    // Default position above the point
    let left = x;
    let top = y - tooltipHeight - 10;
    
    // Check if tooltip would go off the left edge
    if (left < 10) {
      left = 10;
    }
    
    // Check if tooltip would go off the right edge
    if (left + tooltipWidth > chartRect.width - 10) {
      left = chartRect.width - tooltipWidth - 10;
    }
    
    // Check if tooltip would go off the top
    if (top < 10) {
      // Position below the point instead
      top = y + 30;
    }
    
    return { left, top };
  };

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

  // Custom hover tooltip
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

  // Function to handle dot click
  const handleDotClick = (data, index, e) => {
    // Get dot position relative to chart
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return;
    
    const rect = chartContainer.getBoundingClientRect();
    const x = e.pageX - rect.left - window.scrollX;
    const y = e.pageY - rect.top - window.scrollY;
    
    setTooltipInfo({
      data: data,
      position: { x, y }
    });
    
    // Stop event propagation
    e.stopPropagation();
  };

  if (loading) {
    return <div className="loading-container">Loading data...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="no-data-container">No valid data points found to display.</div>;
  }

  // Calculate tooltip position if we have tooltip info
  const tooltipPosition = tooltipInfo 
    ? calculateTooltipPosition(tooltipInfo.position.x, tooltipInfo.position.y) 
    : { left: 0, top: 0 };

  return (
    <div className="visualization-container">
      <h2 className="visualization-title" style={{ textAlign: 'center' }}>The cost of being smuggled into the U.S. from Mexico</h2>
      <div 
        ref={chartContainerRef}
        className="chart-container" 
        style={{ position: 'relative' }}
      >
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
              domain={['dataMin - 1', 'dataMax + 1']}
              tickCount={15}
              angle={-45}
              textAnchor="end"
              height={60}
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
              onClick={handleDotClick}
            />
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Detailed tooltip */}
        {tooltipInfo && (
          <div 
            className="detailed-tooltip"
            style={{
              position: 'absolute',
              left: `${tooltipPosition.left}px`,
              top: `${tooltipPosition.top}px`,
              width: '300px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tooltip-header">
              <p className="tooltip-date">Date: {tooltipInfo.data.date}</p>
              <button 
                className="tooltip-close-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipInfo(null);
                }}
              >
                ×
              </button>
            </div>
            <p className="tooltip-price">Price: <strong>${tooltipInfo.data.price.toLocaleString()}</strong></p>
            <div className="tooltip-narrative">
              <p className="tooltip-narrative-title">Case Narrative:</p>
              <p className="tooltip-narrative-text">{tooltipInfo.data.narrative}</p>
            </div>
            {tooltipInfo.data.source && (
              <div className="tooltip-source">
                <p className="tooltip-source-title">Source:</p>
                <a 
                  href={tooltipInfo.data.source.startsWith('http') ? tooltipInfo.data.source : `https://${tooltipInfo.data.source}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="tooltip-source-link"
                >
                  Click for source
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="visualization-footer">
        <p>Using data from federal court documents, this visualization shows how much money migrants have said they pay to be smuggled into the U.S. over the years.</p>
        <p>Click on data points to see details about each of the {data.length} cases currently included.</p>
        <p>Data compiled manually by Luke Harold. Coding by Claude.ai.</p>
      </div>
    </div>
  );
};

export default BorderSmugglingVisualization;