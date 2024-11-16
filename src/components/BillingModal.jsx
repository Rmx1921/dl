import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllTicketsFromDB } from '../components/helpers/indexdb';
import { getLastBillNumber, saveBillNumber } from './helpers/billnodb'
import { saveBills } from './helpers/billsdb'
import SlipModal from './SlipModal';
import { openDB } from 'idb';
import { FaSearch, FaTrash} from 'react-icons/fa';
import { TiTickOutline } from 'react-icons/ti';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { generateSummary } from './../utils/groupTickets'
import { formatDate } from '../utils/fortmatDate'

const BillingModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [displayedTickets, setDisplayedTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState(new Set());
    const [buyerName, setBuyerName] = useState('');
    const [ticketsToShow, setTicketsToShow] = useState(20);
    const [drawDates, setDrawDates] = useState([]);
    const [selectedDrawDate, setSelectedDrawDate] = useState('');
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [ticketprice] = useState([33.36, 42.50, 33.10, 42.10])
    const [selectedPrice, setSelectedPrice] = useState(Number(ticketprice[0]));
    const [newprice, setNewprice] = useState(false)
    const [pwtPrice, setpwtPrice] = useState(0)
    const [lastbillno,setBillno]=useState(0)
    const [tempBillNo, setTempBillNo] = useState(null);
    const [start,setStart]=useState('')
    const [end, setEnd]=useState('')
    const [prefixFilter, setPrefixFilter]=useState([])
    const [filterTicketData,setFilterTicketData]=useState([])
    const [newSelected,setNewSelected]=useState(new Set())
    const [newSelected1, setNewSelected1] = useState(new Set())
    const [showTicket, setShowTickets] = useState(new Date())

    useEffect(()=>{
        setSelectedDrawDate(formatDate(showTicket))
    }, [showTicket])

    function filterTicketsByRange(tickets, startSuffix, endSuffix) {
        if (startSuffix !== null && endSuffix !== null) {
            const filteredTickets = [];

            for (const ticket of tickets) {
                const idSuffix = parseInt(ticket.id.slice(-2), 10);
                if (idSuffix >= startSuffix && idSuffix <= endSuffix) {
                    filteredTickets.push(ticket);
                }
            }

            return filteredTickets;
        } else {
            return null;
        }
    }

    const handleStart = (event)=>{
        setStart(event.target.value)
    }

    const handleEnd = (event) => {
        setEnd(event.target.value);
    };

    useEffect(()=>{
        const out = filterTicketsByRange(selectedTickets, start, end)
        setPrefixFilter(out)
    }, [start, end])
    
    const groupedTicketData = useMemo(() => {
        if (!prefixFilter) return [];

        const filteredGroupedTickets = prefixFilter.reduce((acc, ticket) => {
            const [startSerial, endSerial, , , ticketname, serialNumber, drawDate] =
                ticket.identifier.split('-');
            const startNumber = prefixFilter[0].number;
            const endNumber = prefixFilter[prefixFilter.length - 1].number;
            const mainKey = `${startSerial}-${endSerial} (${startNumber}-${endNumber}) - ${ticketname}`;

            if (!acc[mainKey]) {
                acc[mainKey] = {
                    info: {
                        serialNumber,
                        drawDate: ticket.drawDate,
                        totalTickets: 0
                    },
                    subGroups: {}
                };
            }

            const subKey = `${ticket.serial}-${startNumber} to ${ticket.serial}-${endNumber}`;
            if (!acc[mainKey].subGroups[subKey]) {
                acc[mainKey].subGroups[subKey] = [];
            }

            acc[mainKey].subGroups[subKey].push(ticket);
            acc[mainKey].info.totalTickets += 1;
            return acc;
        }, {});

        return Object.entries(filteredGroupedTickets);
    }, [prefixFilter]);

    useEffect(() => {
        setFilterTicketData(groupedTicketData);
    }, [groupedTicketData]);

    const getSelectedTickets = (groupedTicketData) => {
        let addToSet = new Set();
        groupedTicketData.forEach(([, { subGroups }]) => {
            Object.values(subGroups).forEach((tickets) => {
                tickets.forEach((ticket) => {
                    addToSet.add(ticket);
                });
            });
        });
        return addToSet;
    };
    
    useEffect(() => {
        setNewSelected(getSelectedTickets(groupedTicketData));
    }, [groupedTicketData]);

    const resetFilters =() => {
        if (newSelected.size > 0) {
            setNewSelected1(prevSelected => {
                const updatedSet = new Set(prevSelected); 
                newSelected.forEach(item => updatedSet.add(item));
                return updatedSet;
            });
            setStart('');
            setEnd('');
            setPrefixFilter([]);
        }else{
            return
        }
    };

    const handleFilter = () => {
        if (start && end) {
            setSelectedTickets(new Set())
            resetFilters()
        }else{
            setNewSelected1(prevSelected => {
                const updatedSet = new Set(prevSelected);
                selectedTickets.forEach(item => updatedSet.add(item));
                return updatedSet;
            });
            setSelectedTickets(new Set())
        }
    };

    async function updateSelectedTicketsStatus(selectedTickets) {
        try {
            const db = await openDB('lotteryDB', 2);
            const tx = db.transaction('ticketsData', 'readwrite');
            const store = tx.objectStore('ticketsData');

            for (const ticket of selectedTickets) {
                const existingTicket = await store.get(ticket.unique);
                if (existingTicket) {
                    existingTicket.state = false;
                    await store.put(existingTicket);
                }
            }

            await tx.done;
            console.log('Selected tickets status updated successfully');
        } catch (error) {
            console.error('Error updating ticket status:', error);
        }
    }

    const calculateTotal = (item) => {
        const total = item.groups.reduce((acc, group) => {
            return acc + group.ranges.reduce((groupAcc, range) => {
                return groupAcc + range.count * range.price;
            }, 0);
        }, 0);
        return pwtPrice ? total - pwtPrice : total;
    };

    const handleBillsave = async(ticketData,billNo, buyerName, pwtPrice, currentDateTime)=>{
       try {
           let total = calculateTotal(finalSortedSummary[0])
            let saveData = {
                type:'Original',
                billno: billNo,
                name: buyerName,
                date:currentDateTime,
                tickets: ticketData,
                pwt : pwtPrice,
                totalAmount: total.toFixed(2),
                ticketPrice: selectedPrice
            }
            await saveBills (saveData)
           console.log('Bill data saved successfully');
       } catch (error) {
        console.error('Error saving the Bill data',error)
       }
    }

    useEffect(()=>{
        async function fetchbillno(){
            const billno = await getLastBillNumber()
            setBillno(billno)
          }
        fetchbillno()
    },[])

    useEffect(() => {
        if (isOpen && modalIsOpen == false) {
            async function fetchTickets(showTicket) {
                const ticketsFromDB = await getAllTicketsFromDB(showTicket);
                const unsoldTickets = ticketsFromDB.filter(ticket => ticket.state === true);
                setAllTickets(unsoldTickets);
                const uniqueDrawDates = [...new Set(unsoldTickets.map(ticket => formatDate(ticket.drawDate)))];
                setDrawDates(uniqueDrawDates);
            }
            fetchTickets(showTicket);
        }
    }, [isOpen, showTicket]);

    const handleDrawDateChange = (event) => {
        setSelectedDrawDate(event.target.value);
        searchTickets(searchQuery, event.target.value);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (allTickets.length > 0) {
                searchTickets(searchQuery, selectedDrawDate);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, allTickets, selectedDrawDate]);

    const searchTickets = (query, drawDate) => {
        if (query.trim() === '' && !drawDate) {
            setSearchResults([]);
            setDisplayedTickets([]);
            return;
        }

        const queryLowerCase = query.toLowerCase();
        let filteredTickets
        filteredTickets = allTickets.filter(ticket => {
            const [serialPart,numberPart] = queryLowerCase.split('-');
            const serialMatch = ticket.serial.toLowerCase().includes(serialPart);
            const numberMatch = numberPart ? ticket.number.toString().startsWith(numberPart) : true;
            const otherFieldsMatch = ticket.id.toLowerCase().includes(queryLowerCase) || ticket.ticketname.toLowerCase().includes(queryLowerCase) || ticket.serialNumber.toLowerCase().includes(queryLowerCase);
            const drawDateMatch = drawDate ? formatDate(ticket.drawDate) === drawDate : true;
            return ((serialMatch && numberMatch) || otherFieldsMatch) && drawDateMatch;
        });

        if (filteredTickets && queryLowerCase) {
            const identifierMatch = filteredTickets[0].number;
            filteredTickets = allTickets.filter(ticket => ticket.number === identifierMatch);
        }

        const groupedTickets = filteredTickets.reduce((acc, ticket) => {
            const [startSerial, endSerial, startNumber, endNumber, ticketname, serialNumber, drawDate] = ticket.identifier.split('-');
            const mainKey = `${startSerial}-${endSerial} (${startNumber}-${endNumber}) - ${ticketname}`;
            if (!acc[mainKey]) {
                acc[mainKey] = { info: { serialNumber, drawDate:ticket.drawDate, totalTickets: 0 }, subGroups: {} };
            }

            const subKey = `${ticket.serial}-${startNumber} to ${ticket.serial}-${endNumber}`;
            if (!acc[mainKey].subGroups[subKey]) {
                acc[mainKey].subGroups[subKey] = [];
            }

            acc[mainKey].subGroups[subKey].push(ticket);
            acc[mainKey].info.totalTickets += 1;
            return acc;
        }, {});

        const results = Object.entries(groupedTickets);
        setSearchResults(results);
        setDisplayedTickets(results.slice(0, ticketsToShow));
    };

    const handleGroupExpand = (groupKey) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    const handleSearchInputChange = (event) => {
        let value = event.target.value;
        if (event.nativeEvent.inputType === 'deleteContentBackward') {
            if (value.length === 2 && searchQuery.charAt(2) === '-') {
                value = value.charAt(0);
            }
        } else if (value.length === 2 && /^[a-zA-Z]{2}$/.test(value)) {
            value = value.toUpperCase() + '-';
        }
        setSearchQuery(value);
    };

    const handleBuyerNameChange = (event) => {
        setBuyerName(event.target.value.toUpperCase());
    };

    const handleLoadMore = () => {
        setTicketsToShow(prevTicketsToShow => prevTicketsToShow + 20);
        setDisplayedTickets(searchResults.slice(0, ticketsToShow + 20));
    };

    const handleSelectTicket = (ticket, groupKey = null) => {
        if (newSelected.size < 1){
            console.log('1')
            setSelectedTickets(prevSelected => {
                const newSelected = new Set(prevSelected);
                if (groupKey) {
                    const [mainKey, subKey, groupIndex] = groupKey.split('|');
                    const mainGroup = searchResults.find(([key]) => key === mainKey);
                    if (mainGroup) {
                        let ticketsToToggle;
                        if (groupIndex !== undefined) {
                            console.log('2')
                            ticketsToToggle = groupTicketsInFives(mainGroup[1].subGroups[subKey])[parseInt(groupIndex)];
                        } else if (subKey) {
                            console.log('3')
                            ticketsToToggle = mainGroup[1].subGroups[subKey];
                        } else {
                        console.log('4')
                            ticketsToToggle = Object.values(mainGroup[1].subGroups).flat();
                        }
                        const allSelected = ticketsToToggle.every(t => newSelected.has(t));
                        ticketsToToggle.forEach(t => {
                            if (allSelected) {
                                newSelected.delete(t);
                            } else {
                                newSelected.add(t);
                            }
                        });
                    }
                } else if (ticket) {
                    if (newSelected.has(ticket)) {
                        newSelected.delete(ticket);
                    } else {
                        newSelected.add(ticket);
                    }
                }
                return newSelected;
            });
        }else{
            setNewSelected(prevSelected => {
                const newSelected = new Set(prevSelected);
                if (groupKey) {
                    console.log(groupKey)
                    const [mainKey, subKey, groupIndex] = groupKey.split('|');
                    const mainGroup = filterTicketData.find(([key]) => key === mainKey);
                    if (mainGroup) {
                        let ticketsToToggle;
                        if (subKey) { 
                            ticketsToToggle = mainGroup[1].subGroups[subKey];
                        } else {
                            ticketsToToggle = Object.values(mainGroup[1].subGroups).flat();
                        }
                        const allSelected = ticketsToToggle.every(t => newSelected.has(t));
                        ticketsToToggle.forEach(t => {
                            if (allSelected) {
                                newSelected.delete(t);
                            } else {
                                newSelected.add(t);
                            }
                        });
                    }
                }
                return newSelected;
            });
        }
    };

    const handleReset = () => {
        setSelectedTickets(new Set());
        setNewSelected(new Set())
        setNewSelected1(new Set())
        setFilterTicketData([])
        setSelectedDrawDate('')
        setSearchQuery('');
        setStart('');
        setEnd('');
    }

    const groupTicketsInFives = (tickets) => {
        return tickets.reduce((acc, ticket, index) => {
            const groupIndex = Math.floor(index / 5);
            if (!acc[groupIndex]) {
                acc[groupIndex] = [];
            }
            acc[groupIndex].push(ticket);
            return acc;
        }, []);
    };

    const finalSortedSummary = generateSummary(selectedTickets, selectedPrice)

    const handlePriceChange = (e) => {
        setSelectedPrice(Number(e.target.value));
    };

    const handleNewprice = () => {
        setNewprice(!newprice)
    }

    const handlesetprice = (e) => {
        let price = Number(e.target.value);
        setSelectedPrice(price);
    }

    const handlepwtprice = (e) => {
        setpwtPrice(Number(e.target.value))
    }

    const handleOpenmodal = () => {
        if(newSelected1.size>0){
            setSelectedTickets(prevSelected => {
                const updatedSet = new Set(prevSelected);
                newSelected1.forEach(item => updatedSet.add(item));
                return updatedSet;
            });
        }
        const newBillNo = lastbillno == null ? 1 : lastbillno + 1;
        setTempBillNo(newBillNo);
        setModalIsOpen(true);
    };

    const handlePrintSuccess = async () => {
        if (tempBillNo !== null) {
            await saveBillNumber(tempBillNo);
            setBillno(tempBillNo);
            await updateSelectedTicketsStatus(Array.from(selectedTickets))
            await handleBillsave(selectedTickets, tempBillNo, buyerName, pwtPrice, currentDateTime)
            setTempBillNo(null);
            setModalIsOpen(false)
            handleReset()
        }
    };

    const handleClose = ()=>{
        handleReset()
        setBuyerName('')
        onClose()
    }
    
    return (
        isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 max-w-5xl w-full flex">
                    <div className="w-1/2 p-4">
                        <div className='flex flex-row justify-between'>
                            <h2 className="text-lg font-bold mb-4">Billing Information</h2>
                            <div className="mb-4">
                                <DatePicker
                                    selected={showTicket}
                                    onChange={date => setShowTickets(date)}
                                    className="w-full px-2 py-2 border border-gray-300"
                                    dateFormat="dd/MM/yyyy"
                                />
                            </div>
                        </div>
                        <div className='flex flex-row gap-3'>
                            <div className="mb-4 flex-1">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search Ticket Serial..."
                                        value={searchQuery}
                                        onChange={handleSearchInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 pr-8"
                                    />
                                    <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-gray-400 cursor-pointer">
                                        <FaSearch />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <select value={selectedDrawDate} onChange={handleDrawDateChange} className="w-full px-4 py-2 border border-gray-300">
                                    <option value="">Draw Date</option>
                                    {drawDates.sort().map((date, index) => (
                                        <option key={index} value={date}>{date}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <button className='bg-[#dc3545] h-[40px] hover:bg-[#c82333] text-white font-bold py-2 px-4' onClick={handleReset}><FaTrash /></button>
                            </div>
                        </div>
                        {selectedTickets.size > 0 && selectedDrawDate !== ''  && (
                            <div className='flex flex-row gap-3'>
                                <div className="mb-4">
                                    <input type="text" placeholder="Start number" value={start} onChange={handleStart} className="w-full px-4 py-2 border border-gray-300" />
                                </div>
                                <div className="mb-4">
                                    <input type="text" placeholder="End number" value={end} onChange={handleEnd} className="w-full px-4 py-2 border border-gray-300" />
                                </div>
                                <div className=''>
                                    <button className='bg-[#1a923e] hover:bg-[#1a923e] text-white font-bold py-3 px-3' onClick={handleFilter}><TiTickOutline /></button>
                                </div>
                            </div>
                        )}
                        <div className="mb-4">
                            <input type="text" placeholder="Enter Buyer's Name" value={buyerName} onChange={handleBuyerNameChange} className="w-full px-4 py-2 border border-gray-300" />
                        </div>
                        <div className="flex gap-2 mb-4">
                            {newprice ? (
                                <input
                                    type='Number'
                                    placeholder='Enter Ticket Price'
                                    onChange={(e) => handlesetprice(e)}
                                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <select
                                    value={selectedPrice}
                                    onChange={handlePriceChange}
                                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {ticketprice.map((price, index) => (
                                        <option key={index} value={price}>
                                            ₹ {price.toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button onClick={handleNewprice} className="px-4 py-2 text-black border font-bold hover:bg-blue-200 hover:text-white">
                                +
                            </button>
                        </div>
                        <div>
                            <input
                                type='Number'
                                placeholder='Price winning ticket'
                                onChange={(e) => handlepwtprice(e)}
                                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className='flex flex-row gap-3'>
                            <button onClick={handleClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4">Close</button>
                            {(selectedTickets.size > 0 || newSelected1.size> 0 ) && buyerName.trim() !== '' &&
                                <button onClick={handleOpenmodal} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4">show bill slip</button>}
                        </div>
                        <div>
                            <SlipModal
                                isOpen={modalIsOpen}
                                onRequestClose={() => setModalIsOpen(false)}
                                ticketSummary={finalSortedSummary}
                                currentDateTime={currentDateTime}
                                name={buyerName}
                                pwt={pwtPrice}
                                billno={tempBillNo || lastbillno}
                                onPrintSuccess={handlePrintSuccess}
                            />
                        </div>
                    </div>
                    <div className="w-1/2 p-4 border-l border-gray-200">
                        <h2 className="text-lg font-bold mb-4">Search Results</h2>
                        <div className="max-h-96 overflow-y-auto">
                            {displayedTickets.length > 0 && newSelected.size< 1 && filterTicketData.length< 1 ? (
                                <div>
                                    {displayedTickets.map(([mainKey, groupData]) => (
                                        <div key={mainKey} className="my-2 border border-gray-200 p-2">
                                            <div className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Object.values(groupData.subGroups).flat().every(t => selectedTickets.has(t))}
                                                    onChange={() => handleSelectTicket(null, mainKey)}
                                                    className="mr-2 w-11 h-11"
                                                />
                                                <span onClick={() => handleGroupExpand(mainKey)} className="flex-grow">
                                                    {expandedGroups.has(mainKey) ? '▼' : '▶'}{' '}{mainKey}
                                                    {groupData && groupData.info ?
                                                        `(${groupData.info.totalTickets} tickets) [Serial: ${groupData.info.serialNumber}, Draw Date: ${formatDate(groupData.info.drawDate)}]`
                                                        : '(No info available)'}
                                                </span>
                                            </div>
                                            {expandedGroups.has(mainKey) && (
                                                <div className="ml-6 mt-2">
                                                    {Object.entries(groupData.subGroups).map(([subKey, tickets]) => (
                                                        <div key={subKey} className="my-1">
                                                            <div className="flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tickets.every(t => selectedTickets.has(t))}
                                                                    onChange={() => handleSelectTicket(null, `${mainKey}|${subKey}`)}
                                                                    className="mr-2 w-6 h-6"
                                                                />
                                                                <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}`)} className="flex-grow">
                                                                    {expandedGroups.has(`${mainKey}-${subKey}`) ? '▼' : '▶'}{' '}{subKey}
                                                                </span>
                                                            </div>
                                                            {expandedGroups.has(`${mainKey}-${subKey}`) && (
                                                                <div className="ml-6 mt-2">
                                                                    {groupTicketsInFives(tickets).map((ticketGroup, groupIndex) => (
                                                                        <div key={groupIndex} className="my-1">
                                                                            <div className="flex items-center cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={ticketGroup.every(t => selectedTickets.has(t))}
                                                                                    onChange={() => handleSelectTicket(null, `${mainKey}|${subKey}|${groupIndex}`)}
                                                                                    className="mr-2 w-6 h-6"
                                                                                />
                                                                                <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}-${groupIndex}`)}>
                                                                                    {expandedGroups.has(`${mainKey}-${subKey}-${groupIndex}`) ? '▼' : '▶'}{' '}
                                                                                    {ticketGroup[0].serial}-{ticketGroup[0].number} to {ticketGroup[ticketGroup.length - 1].serial}-{ticketGroup[ticketGroup.length - 1].number}
                                                                                </span>
                                                                            </div>
                                                                            {expandedGroups.has(`${mainKey}-${subKey}-${groupIndex}`) && (
                                                                                <div className="ml-6 mt-2">
                                                                                    {ticketGroup.map((ticket, ticketIndex) => (
                                                                                        <div key={ticketIndex} className="my-1">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={selectedTickets.has(ticket)}
                                                                                                onChange={() => handleSelectTicket(ticket)}
                                                                                                className="mr-2 w-6 h-6"
                                                                                            />
                                                                                            <span>{ticket.serial}-{ticket.number}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {searchResults.length > displayedTickets.length && (
                                        <button onClick={handleLoadMore} className="text-blue-500 hover:text-blue-700 cursor-pointer mt-2">Load More</button>
                                    )}
                                </div>
                            ) : (
                                    prefixFilter && prefixFilter.length > 1 ? (
                                    <div>
                                            {filterTicketData.map(([mainKey, groupData]) => (
                                                <div key={mainKey} className="my-2 border border-gray-200 p-2">
                                                    <div className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={Object.values(groupData.subGroups).flat().every(t => newSelected.has(t))}
                                                            onChange={() => handleSelectTicket(null, mainKey)}
                                                            className="mr-2"
                                                        />
                                                        <span onClick={() => handleGroupExpand(mainKey)} className="flex-grow">
                                                            {expandedGroups.has(mainKey) ? '▼' : '▶'}{' '}{mainKey}
                                                            {groupData && groupData.info ?
                                                                `(${groupData.info.totalTickets} tickets) [Serial: ${groupData.info.serialNumber}, Draw Date: ${formatDate(groupData.info.drawDate)}]`
                                                                : '(No info available)'}
                                                        </span>
                                                    </div>
                                                    {expandedGroups.has(mainKey) && (
                                                        <div className="ml-6 mt-2">
                                                            {Object.entries(groupData.subGroups).map(([subKey, tickets], groupIndex) => (
                                                                <div key={subKey} className="my-1">
                                                                    <div className="flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={tickets.every(t => newSelected.has(t))}
                                                                            onChange={() => handleSelectTicket(null, `${mainKey}|${subKey}|${groupIndex}`)}
                                                                            className="mr-2"
                                                                        />
                                                                        <span onClick={() => handleGroupExpand(`${mainKey}-${subKey}-${groupIndex}`)} className="flex-grow">
                                                                            {subKey}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Enter ticket serial, number, draw date, or ID</p>
                                )
                            )}
                        </div>
                    </div>
                    <div className="w-52 p-4 border-l border-gray-200">
                        <p>hellow</p>
                    </div>
                </div>
            </div>
        )
    );
};

export default BillingModal;