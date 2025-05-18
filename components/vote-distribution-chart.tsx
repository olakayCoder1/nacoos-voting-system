import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const VoteDistributionChart = ({ candidates }) => {
  // Sort candidates by votes in descending order
  const sortedCandidates = [...candidates]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .map(candidate => ({
      name: candidate.name.length > 15 ? `${candidate.name.substring(0, 15)}...` : candidate.name,
      fullName: candidate.name,
      votes: candidate.votes || 0
    }));

  // Custom tooltip to display candidate name and votes
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-md border rounded">
          <p className="font-medium">{payload[0].payload.fullName}</p>
          <p className="text-sm">{`Votes: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sortedCandidates} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={70} 
          tick={{ fontSize: 12 }} 
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          name="Number of Votes" 
          dataKey="votes" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]} 
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VoteDistributionChart;