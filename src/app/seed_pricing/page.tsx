// 'use client';

// import { useEffect, useState } from 'react';
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
// import { supabase } from '@/lib/supabaseClient';
// import { Box } from '@mui/material';


// interface SeedPricing {
//   id: number;
//   seed_id: number;
//   seed_cost: number;
//   bag_cost: boolean;
//   envelope_cost: boolean;
//   total_cost: number;
//   postage: number;
//   retail_price: number;
//   payment_fee: number;
//   retail_price_with_postage: number;
//   sales_price_total: number,
//   net_profit: number,
//   test_price: number,
//   test_profit: number,
//   seeds_per_envelope: number,
//   inventory_id: number,
//   test_fee: number
// }

// export default function PricingPage() {
//   const [prices, setPrices] = useState<SeedPricing[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPrices = async () => {
//         const { data, error } = await supabase
//             .from('costs_and_pricing')
//             .select(`
//                 *,
//                 seeds (
//                 category,
//                 type
//                 )
//             `)
//       if (error) {
//         console.error('Error fetching prices:', error);
//       } else {
//         setPrices(data || []);
//       }
//       setLoading(false);
//     };
//     fetchPrices();
//   }, []);

//   const columns: GridColDef[] = [
//     { field: 'id', headerName: 'ID', width: 90, sortable: true, editable: false },
//     { field: 'seed_id', headerName: 'Seed ID', width: 130, sortable: true, editable: false },
//     { field: 'seed_cost', headerName: 'Seed Cost', width: 150, sortable: true, editable: true },
//     { field: 'bag_cost', headerName: 'Bag?', width: 130, sortable: true, editable: true },
//     { field: 'envelope_cost', headerName: 'Envelope?', width: 150, sortable: true, editable: true },
//     { field: 'total_cost', headerName: 'Total Cost', width: 180, sortable: true, editable: false },
//     { field: 'postage', headerName: 'Postage', width: 130, sortable: true, editable: true },
//     { field: 'retail_price', headerName: 'Retail Price', width: 130, sortable: true, editable: true },
//     { field: 'payment_fee', headerName: 'Payment Fee', width: 130, sortable: true, editable: false },
//     { field: 'retail_price_with_postage', headerName: 'Retail + Postage', width: 100, sortable: true, editable: false },
//     { field: 'sales_price_total', headerName: 'Total Sales Price', width: 130, sortable: true, editable: false },
//     { field: 'net_profit', headerName: 'Net Profit', width: 130, sortable: true, editable: false },
//     { field: 'test_price', headerName: 'Test Price', width: 130, sortable: true, editable: true },
//     { field: 'test_profit', headerName: 'Test Profit', width: 130, sortable: true, editable: false },
//     { field: 'seeds_per_envelope', headerName: 'Seeds per Envelope', width: 130, sortable: true, editable: false },
//     { field: 'inventory_id', headerName: 'Inventory ID', width: 130, sortable: true, editable: false },
//     { field: 'test_fee', headerName: 'Test Fee', width: 130, sortable: true, editable: false },
//   ];

//     const [searchText, setSearchText] = useState('');
//     const filteredPrices = prices;
//     //   .filter(
//     // (price) =>
//     //     price.seed_cost?.toLowerCase().includes(searchText.toLowerCase()) ||
//     //     price.payment_fee?.toLowerCase().includes(searchText.toLowerCase()) ||
//     //     price.test_price?.toLowerCase().includes(searchText.toLowerCase())
//     // );

//   return (
//     <div style={{ height: '100%', width: '100%', padding: '1rem' }}>
//         <h1 className="text-4xl font-bold text-green-800 text-center mb-6 tracking-wide">
//             🌻 Seed Costs & Prices
//         </h1>




//         <Box display="flex" justifyContent="center" mb={2}>
//             <input
//                 type="text"
//                 placeholder="Search prices..."
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//                 style={{
//                     padding: '0.5rem',
//                     fontSize: '1rem',
//                     width: '300px',
//                     borderRadius: '4px',
//                     border: '1px solid #ccc',
//                 }}
//             />
//         </Box>


//         <div style={{ height: '80vh', width: '100%' }}>
//         <DataGrid
//             rows={filteredPrices}
//             columns={columns}
//             loading={loading}
//             getRowId={(row) => row.id}
//             pageSizeOptions={[10, 25, 50]}
//         />
//         </div>
//     </div>
//   );
// }
