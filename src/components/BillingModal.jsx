import React, { useState, useEffect } from 'react';
import { getAllTicketsFromDB } from '../components/helpers/indexdb';
import { getLastBillNumber, saveBillNumber } from './helpers/billnodb'
import { saveBills } from './helpers/billsdb'
import SlipModal from './SlipModal';
import { openDB } from 'idb';

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
    const [ticketprice] = useState([33.36, 42.50])
    const [selectedPrice, setSelectedPrice] = useState(Number(ticketprice[0]));
    const [newprice, setNewprice] = useState(false)
    const [pwtPrice, setpwtPrice] = useState(0)
    const [lastbillno,setBillno]=useState(0)
    const [tempBillNo, setTempBillNo] = useState(null);

    async function updateSelectedTicketsStatus(selectedTickets) {
        try {
            const db = await openDB('lotteryDB', 1);
            const tx = db.transaction('tickets', 'readwrite');
            const store = tx.objectStore('tickets');

            for (const ticket of selectedTickets) {
                const existingTicket = await store.get(ticket.id);
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
        async function fetchTickets() {
            const ticketsFromDB = await getAllTicketsFromDB();
            const unsoldTickets = ticketsFromDB.filter(ticket => ticket.state === true);
            setAllTickets(unsoldTickets);
            const uniqueDrawDates = [...new Set(unsoldTickets.map(ticket => new Date(ticket.drawDate).toISOString().split('T')[0]))];
            setDrawDates(uniqueDrawDates);
        }
        fetchTickets();
    }, []);

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
        const filteredTickets = allTickets.filter(ticket => {
            const [serialPart, numberPart] = queryLowerCase.split('-');
            const serialMatch = ticket.serial.toLowerCase().includes(serialPart);
            const numberMatch = numberPart ? ticket.number.toString().startsWith(numberPart) : true;
            const otherFieldsMatch = ticket.id.toLowerCase().includes(queryLowerCase) || ticket.ticketname.toLowerCase().includes(queryLowerCase) || ticket.serialNumber.toLowerCase().includes(queryLowerCase);
            const drawDateMatch = drawDate ? new Date(ticket.drawDate).toISOString().split('T')[0] === drawDate : true;
            return ((serialMatch && numberMatch) || otherFieldsMatch) && drawDateMatch;
        });

        const groupedTickets = filteredTickets.reduce((acc, ticket) => {
            const [startSerial, endSerial, startNumber, endNumber, ticketname, serialNumber, drawDate] = ticket.identifier.split('-');
            const mainKey = `${startSerial}-${endSerial} (${startNumber}-${endNumber}) - ${ticketname}`;
            if (!acc[mainKey]) {
                acc[mainKey] = { info: { serialNumber, drawDate: new Date(drawDate).toLocaleDateString(), totalTickets: 0 }, subGroups: {} };
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
        setBuyerName(event.target.value);
    };

    const handleLoadMore = () => {
        setTicketsToShow(prevTicketsToShow => prevTicketsToShow + 20);
        setDisplayedTickets(searchResults.slice(0, ticketsToShow + 20));
    };

    const handleSelectTicket = (ticket, groupKey = null) => {
        setSelectedTickets(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (groupKey) {
                const [mainKey, subKey, groupIndex] = groupKey.split('|');
                const mainGroup = searchResults.find(([key]) => key === mainKey);
                if (mainGroup) {
                    let ticketsToToggle;
                    if (groupIndex !== undefined) {
                        ticketsToToggle = groupTicketsInFives(mainGroup[1].subGroups[subKey])[parseInt(groupIndex)];
                    } else if (subKey) {
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
            } else if (ticket) {
                if (newSelected.has(ticket)) {
                    newSelected.delete(ticket);
                } else {
                    newSelected.add(ticket);
                }
            }
            return newSelected;
        });
    };

    const handleReset = () => {
        setSelectedTickets(new Set());
        setSelectedDrawDate('')
        setSearchQuery('');
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

    const selectedTicketSummary = Array.from(selectedTickets).reduce((acc, ticket) => {
        const [startSerial, endSerial, startNumber, endNumber, ticketname, serialNumber, drawDate] = ticket.identifier.split('-');
        const seriesKey = `${ticketname}-${drawDate}`;
        const date = ticket.drawDate
        if (!acc[seriesKey]) {
            acc[seriesKey] = {
                ticketname,
                drawDate: new Date(date).toLocaleDateString(),
                ranges: {}
            };
        }

        if (!acc[seriesKey].ranges[`${startNumber}-${endNumber}`]) {
            acc[seriesKey].ranges[`${startNumber}-${endNumber}`] = {
                startNumber,
                endNumber,
                series: {},
                price: Number(selectedPrice)
            };
        }

        if (!acc[seriesKey].ranges[`${startNumber}-${endNumber}`].series[ticket.serial]) {
            acc[seriesKey].ranges[`${startNumber}-${endNumber}`].series[ticket.serial] = 0;
        }
        acc[seriesKey].ranges[`${startNumber}-${endNumber}`].series[ticket.serial]++;

        return acc;
    }, {});

    const sortedSummary = Object.entries(selectedTicketSummary).map(([key, value]) => {
        const rangeGroups = Object.entries(value.ranges).reduce((acc, [rangeKey, rangeData]) => {
            const seriesList = Object.keys(rangeData.series).sort();
            const seriesGroups = seriesList.reduce((groups, serial) => {
                if (groups.length === 0 || serial.charCodeAt(0) - groups[groups.length - 1].end.charCodeAt(0) > 1) {
                    groups.push({ start: serial, end: serial, serials: [serial] });
                } else {
                    groups[groups.length - 1].end = serial;
                    groups[groups.length - 1].serials.push(serial);
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
                acc[groupKey].ranges.push({
                    startNumber: rangeData.startNumber,
                    endNumber: rangeData.endNumber,
                    count: group.serials.reduce((sum, serial) => sum + rangeData.series[serial], 0),
                    price: rangeData.price
                });
            });

            return acc;
        }, {});

        return {
            ticketname: value.ticketname,
            drawDate: value.drawDate,
            groups: Object.values(rangeGroups)
        };
    });
    
    const finalSortedSummary = sortedSummary
        .sort((a, b) => a.groups[0].series.localeCompare(b.groups[0].series))
        .map(item => ({
            ...item,
            groups: item.groups.map(group => ({
                ...group,
                ranges: group.ranges.sort((a, b) => parseInt(a.startNumber) - parseInt(b.startNumber)),
                totalAmount: group.ranges.reduce((sum, range) => sum + range.count * range.price, 0)
            }))
        }));

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
        const newBillNo = lastbillno == null ? 1 : lastbillno + 1;
        setTempBillNo(newBillNo);
        setModalIsOpen(true);
    };

    const handlePrintSuccess = async () => {
        if (tempBillNo !== null) {
            await saveBillNumber(tempBillNo);
            setBillno(tempBillNo);
            // await updateSelectedTicketsStatus(Array.from(selectedTickets))
            await handleBillsave(selectedTickets, tempBillNo, buyerName, pwtPrice, currentDateTime)
            setTempBillNo(null);
            setModalIsOpen(false)
            handleReset()
        }
    };

    return (
        isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg max-w-4xl w-full flex">
                    <div className="w-1/2 p-4">
                        <h2 className="text-lg font-bold mb-4">Billing Information</h2>
                        <div className='flex flex-row gap-3'>
                            <div className="mb-4">
                                <input type="text" placeholder="Search Ticket Serial..." value={searchQuery} onChange={handleSearchInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div className="mb-4">
                                <select value={selectedDrawDate} onChange={handleDrawDateChange} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                                    <option value="">Draw Date</option>
                                    {drawDates.map((date, index) => (
                                        <option key={index} value={date}>{date}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='mt-1'>
                                <button className='bg-red-500 p-1 rounded-md text-white hover:bg-red-600' onClick={handleReset}>Reset</button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <input type="text" placeholder="Enter Buyer's Name" value={buyerName} onChange={handleBuyerNameChange} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="flex gap-2 mb-4">
                            {newprice ? (
                                <input
                                    type='Number'
                                    placeholder='Enter Ticket Price'
                                    onChange={(e) => handlesetprice(e)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <select
                                    value={selectedPrice}
                                    onChange={handlePriceChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {ticketprice.map((price, index) => (
                                        <option key={index} value={price}>
                                            ₹ {price.toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button onClick={handleNewprice} className="px-4 py-2 text-black border font-bold rounded-md hover:bg-blue-200 hover:text-white">
                                +
                            </button>
                        </div>
                        <div>
                            <input
                                type='Number'
                                placeholder='Price winning ticket'
                                onChange={(e) => handlepwtprice(e)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className='flex flex-row gap-3'>
                            <button onClick={onClose} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Close</button>
                            {selectedTickets.size > 0 && buyerName.trim() !== '' &&
                                <button onClick={handleOpenmodal} className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">show bill slip</button>}
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
                            {displayedTickets.length > 0 ? (
                                <div>
                                    {displayedTickets.map(([mainKey, groupData]) => (
                                        <div key={mainKey} className="my-2 border border-gray-200 p-2 rounded-md">
                                            <div className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Object.values(groupData.subGroups).flat().every(t => selectedTickets.has(t))}
                                                    onChange={() => handleSelectTicket(null, mainKey)}
                                                    className="mr-2"
                                                />
                                                <span onClick={() => handleGroupExpand(mainKey)} className="flex-grow">
                                                    {expandedGroups.has(mainKey) ? '▼' : '▶'}{' '}{mainKey}
                                                    {groupData && groupData.info ?
                                                        `(${groupData.info.totalTickets} tickets) [Serial: ${groupData.info.serialNumber}, Draw Date: ${groupData.info.drawDate}]`
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
                                                                    className="mr-2"
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
                                                                                    className="mr-2"
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
                                                                                                className="mr-2"
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
                                <p className="text-gray-500 text-sm">Enter ticket serial, number, draw date, or ID</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default BillingModal;