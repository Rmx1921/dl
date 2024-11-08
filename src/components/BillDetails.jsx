import React, { useState, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import { Search, Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import { findBills, getBills,saveBills} from './helpers/billsdb';
import BillEditModal from './BillEditModal';
import SlipModal from './SlipModal'


const BillDetails = () => {
    const navigate = useNavigate();

    const [searchDate, setSearchDate] = useState(null);
    const [billsData, setBillsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedTickets,setSelectedTickets]= useState(new Set())
    const [buyerName, setBuyerName] = useState('');
    const [tempBillNo, setTempBillNo] = useState(null);
    const [pwtPrice, setpwtPrice] = useState(0)
    const [selectedPrice, setSelectedPrice] = useState(0);
    
    const handlePrinting = (bill)=>{
        console.log(bill)
        setSelectedTickets(new Set(bill.tickets))
        setBuyerName(bill.name);
        setTempBillNo(bill.billno)
        setSelectedPrice(bill.ticketPrice)
        setpwtPrice(bill.pwt)
        setModalIsOpen(true)
    }

    const handlePrintSuccess = async () => {
            setModalIsOpen(false)
    };

    const handleEdit = (bill) => {
        setSelectedBill(bill);
        setIsModalOpen(true);
    };

    const handleSaveEdit = async (updatedBill) => {
        try {
            await saveBills(updatedBill)
            await fetchBills(pageIndex, pageSize);
            setIsModalOpen(false);
            setSelectedBill(null);
        } catch (error) {
            console.error('Error updating bill:', error);
        }
    };

    const fetchBills = async (pageIndex, pageSize) => {
        setLoading(true);
        try {
            const bills = await getBills(pageSize, pageIndex * pageSize);
            processBilldata(bills);
        } catch (error) {
            console.error('Error fetching bills:', error);
        }
        setLoading(false);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const processBilldata = (bills) => {
        const processed = bills.map(bill => ({
            billno: bill.billno,
            name: bill.name,
            totalAmount: bill.totalAmount,
            date: formatDate(bill.date),
            tickets: Array.from(bill.tickets),
            pwt: bill.pwt,
            ticketPrice: bill?.ticketPrice,
            type:bill?.type
        }));
        setBillsData(processed);
    };

    useEffect(() => {
        fetchBills(0, 5);
    }, []);

    const data = React.useMemo(() => billsData, [billsData]);

    const columns = React.useMemo(
        () => [
            { Header: 'BillNo', accessor: 'billno' },
            { Header: 'Type',accessor: 'type'},
            { Header: 'Buyer Name', accessor: 'name' },
            { Header: 'Date', accessor: 'date' },
            { Header: 'Amount', accessor: 'totalAmount' },
            {
                Header: 'Actions',
                Cell: ({ row }) => (
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="px-4 py-2 bg-green-500 text-white"
                    >
                        Edit
                    </button>
                ),
            },
            {
                Header: 'Print',
                Cell: ({ row }) => (
                    <button
                        onClick={() => handlePrinting(row.original)}
                        className="px-4 py-2 bg-blue-400 text-white"
                    >
                        Print
                    </button>
                ),
            }
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        state,
        setGlobalFilter,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
    } = useTable(
        { columns, data, initialState: { pageIndex: 0, pageSize: 5 } },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const { globalFilter, pageIndex, pageSize } = state;

    const searchBills = async (query) => {
        setLoading(true);
        try {
            const bills = await findBills(query);
            processBilldata(bills);
        } catch (error) {
            console.error('Error searching bills:', error);
        }
        setLoading(false);
    };

    const handleSearchChange = (e) => {
        setGlobalFilter(e.target.value);
    };

    const handleDateSearch = () => {
        if (searchDate) {
            const formattedDate = formatDate(searchDate);
            searchBills(formattedDate);
        } else {
            fetchBills(0, 5);
        }
    };

    const createTicketSummary = (selectedTickets, selectedPrice) => {
        return Array.from(selectedTickets).reduce((acc, ticket) => {
            const [, , , , ticketname, , drawDate] = ticket.identifier.split('-');
            const seriesKey = `${ticketname}-${ticket.serialNumber}`;
            const date = ticket.drawDate;
            const serialNum = ticket.serialNumber;

            if (!acc[seriesKey]) {
                acc[seriesKey] = {
                    ticketname: ticketname.split('-')[0],
                    drawDate: new Date(date).toLocaleDateString(),
                    serialNum,
                    ranges: {}
                };
            }

            const ticketsInSeries = Array.from(selectedTickets).filter(t =>
                t.serialNumber === ticket.serialNumber &&
                t.ticketname === ticket.ticketname
            );

            const numbers = ticketsInSeries.map(t => t.number);
            const findContinuousRanges = (nums) => {
                if (nums.length === 0) return [];

                const sortedNums = [...nums].sort((a, b) => a - b);
                const ranges = [];
                let start = sortedNums[0];
                let prev = start;

                for (let i = 1; i <= sortedNums.length; i++) {
                    if (i === sortedNums.length || sortedNums[i] > prev + 1) {
                        ranges.push({
                            start: start,
                            end: prev
                        });
                        if (i < sortedNums.length) {
                            start = sortedNums[i];
                            prev = start;
                        }
                    } else {
                        prev = sortedNums[i];
                    }
                }
                return ranges;
            };

            const continuousRanges = findContinuousRanges(numbers);
            continuousRanges.forEach(range => {
                const rangeKey = `${range.start}-${range.end}`;
                if (!acc[seriesKey].ranges[rangeKey]) {
                    acc[seriesKey].ranges[rangeKey] = {
                        startNumber: range.start.toString(),
                        endNumber: range.end.toString(),
                        series: {},
                        serialNum,
                        price: Number(selectedPrice)
                    };
                }

                if (ticket.number >= range.start && ticket.number <= range.end) {
                    if (!acc[seriesKey].ranges[rangeKey].series[ticket.serial]) {
                        acc[seriesKey].ranges[rangeKey].series[ticket.serial] = 0;
                    }
                    acc[seriesKey].ranges[rangeKey].series[ticket.serial]++;
                }
            });

            return acc;
        }, {});
    };

    const processSummaryIntoGroups = (ticketSummary) => {
        return Object.entries(ticketSummary).map(([key, value]) => {
            const rangeGroups = Object.entries(value.ranges).reduce((acc, [rangeKey, rangeData]) => {
                const seriesList = Object.keys(rangeData.series).sort();
                const seriesGroups = seriesList.reduce((groups, serial) => {
                    const currentGroup = groups[groups.length - 1];

                    if (groups.length === 0 ||
                        serial.charCodeAt(0) - currentGroup.serials[currentGroup.serials.length - 1].charCodeAt(0) > 1) {
                        groups.push({
                            start: serial,
                            end: serial,
                            serials: [serial]
                        });
                    } else {
                        currentGroup.end = serial;
                        currentGroup.serials.push(serial);
                    }
                    return groups;
                }, []);

                seriesGroups.forEach(group => {
                    const groupKey = `${group.start}-${group.end}`;
                    if (!acc[groupKey]) {
                        acc[groupKey] = {
                            series: group.serials.join(','),
                            ranges: []
                        };
                    }
                    const count = group.serials.reduce((sum, serial) =>
                        sum + (rangeData.series[serial] || 0), 0);

                    acc[groupKey].ranges.push({
                        startNumber: rangeData.startNumber,
                        endNumber: rangeData.endNumber,
                        count,
                        price: rangeData.price
                    });
                });

                return acc;
            }, {});

            return {
                ticketname: value.ticketname,
                drawDate: value.drawDate,
                serialNum: value.serialNum,
                groups: Object.values(rangeGroups)
            };
        });
    };

    const createFinalSummary = (sortedSummary) => {
        return sortedSummary
            .sort((a, b) => {
                const ticketCompare = a.ticketname.localeCompare(b.ticketname);
                if (ticketCompare !== 0) return ticketCompare;

                return a.groups[0]?.series.localeCompare(b.groups[0]?.series || '') || 0;
            })
            .map(item => ({
                ...item,
                serialNum: item.serialNum.trim().replace(/\s*-\s*/g, '-').replace(/\s+/g, ' '),
                groups: item.groups.map(group => ({
                    ...group,
                    ranges: group.ranges
                        .sort((a, b) => parseInt(a.startNumber) - parseInt(b.startNumber)),
                    totalAmount: group.ranges.reduce((sum, range) =>
                        sum + (range.count * range.price), 0)
                }))
            }));
    };

    const generateSummary = (selectedTickets, selectedPrice) => {
        const summary = createTicketSummary(selectedTickets, selectedPrice);
        const groupedSummary = processSummaryIntoGroups(summary);
        return createFinalSummary(groupedSummary);
    };

    const finalSortedSummary = generateSummary(selectedTickets, selectedPrice)

    return (
        <div className="flex flex-col h-screen bg-gray-100 p-4">
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="bg-[#6c757d] hover:bg-[#545b62] text-white font-bold py-2 px-4"
                >
                    Home
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Bills Management</h1>
                <div className="w-20"></div>
            </div>

            <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2 w-1/3 relative">
                    <input
                        value={globalFilter || ""}
                        onChange={handleSearchChange}
                        placeholder="Search bills..."
                        className="pl-8 pr-4 py-2 w-full border rounded-md"
                    />
                    <Search className="w-4 h-4 absolute left-2 text-gray-500" />
                </div>

                <div className="flex items-center space-x-2">
                    <DatePicker
                        selected={searchDate}
                        onChange={date => setSearchDate(date)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                    <button onClick={handleDateSearch} className="px-4 py-2 bg-blue-500 text-white rounded-md">
                        Search by Date
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow flex-grow overflow-hidden">
                <table {...getTableProps()} className="min-w-full">
                    <thead>
                        {headerGroups.map(headerGroup => {
                            const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                            return (
                                <tr key={key} {...headerGroupProps} className="bg-gray-50 border-b">
                                    {headerGroup.headers.map(column => {
                                        const { key, ...columnProps } = column.getHeaderProps(column.getSortByToggleProps());
                                        return (
                                            <th
                                                key={key}
                                                {...columnProps}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {column.render('Header')}
                                                <span>
                                                    {column.isSorted
                                                        ? column.isSortedDesc
                                                            ? <ChevronDown className="w-4 h-4 inline-block ml-1" />
                                                            : <ChevronUp className="w-4 h-4 inline-block ml-1" />
                                                        : ''}
                                                </span>
                                            </th>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map(row => {
                            prepareRow(row);
                            const { key, ...rowProps } = row.getRowProps();
                            return (
                                <tr key={key} {...rowProps} className="bg-white border-b">
                                    {row.cells.map(cell => {
                                        const { key, ...cellProps } = cell.getCellProps();
                                        return (
                                            <td
                                                key={key}
                                                {...cellProps}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                            >
                                                {cell.render('Cell')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className="flex items-center px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                </button>
                <span className="text-sm text-gray-700">
                    Page{' '}
                    <strong>
                        {pageIndex + 1} of {pageOptions.length}
                    </strong>
                </span>
                <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="text-sm text-gray-700 bg-white border rounded-md px-2 py-1"
                >
                    {[5, 10, 20].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="flex items-center px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                </button>
            </div>
            {isModalOpen && (
                <BillEditModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    billData={selectedBill}
                    onSave={handleSaveEdit}
                    onUpdateBill={handleSaveEdit}
                />
            )}
            <>
                <SlipModal
                    isOpen={modalIsOpen}
                    onRequestClose={() => setModalIsOpen(false)}
                    ticketSummary={finalSortedSummary}
                    currentDateTime={new Date()}
                    name={buyerName}
                    pwt={pwtPrice}
                    billno={tempBillNo}
                    onPrintSuccess={handlePrintSuccess}
                />
            </>
        </div>
    );
};

export default BillDetails;