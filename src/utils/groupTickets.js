import { useMemo } from 'react';
import { formatDate } from './fortmatDate'

const createTicketSummary = (selectedTickets, selectedPrice) => {
    const seriesSummary = Array.from(selectedTickets).reduce((acc, ticket) => {
        const [, , , , ticketname, , drawDate] = ticket.identifier.split('-');
        const seriesKey = `${ticketname}-${ticket.serialNumber}`;

        if (!acc[seriesKey]) {
            acc[seriesKey] = {
                ticketname: ticket.ticketname,
                drawDate: formatDate(ticket.drawDate),
                serialNum: ticket.serialNumber,
                seriesRanges: {}
            };
        }

        if (!acc[seriesKey].seriesRanges[ticket.serial]) {
            acc[seriesKey].seriesRanges[ticket.serial] = [];
        }
        acc[seriesKey].seriesRanges[ticket.serial].push(ticket.number);
        return acc;
    }, {});

    Object.keys(seriesSummary).forEach(seriesKey => {
        const group = seriesSummary[seriesKey];
        const allRanges = {};
        Object.entries(group.seriesRanges).forEach(([series, numbers]) => {
            const sortedNums = [...numbers].sort((a, b) => a - b);
            let start = sortedNums[0];
            let prev = start;

            for (let i = 1; i <= sortedNums.length; i++) {
                if (i === sortedNums.length || sortedNums[i] > prev + 1) {
                    const rangeKey = `${start}-${prev}`;
                    if (!allRanges[rangeKey]) {
                        allRanges[rangeKey] = {
                            startNumber: start.toString(),
                            endNumber: prev.toString(),
                            series: {},
                            serialNum: group.serialNum,
                            price: Number(selectedPrice)
                        };
                    }
                    allRanges[rangeKey].series[series] =
                        (prev - start + 1);

                    if (i < sortedNums.length) {
                        start = sortedNums[i];
                        prev = start;
                    }
                } else {
                    prev = sortedNums[i];
                }
            }
        });

        group.ranges = allRanges;
        delete group.seriesRanges;
    });

    return seriesSummary;
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
                        serials: [serial],
                        startNumber: rangeData.startNumber,
                        endNumber: rangeData.endNumber
                    });
                } else {
                    if (rangeData.startNumber === currentGroup.startNumber &&
                        rangeData.endNumber === currentGroup.endNumber) {
                        currentGroup.end = serial;
                        currentGroup.serials.push(serial);
                    } else {
                        groups.push({
                            start: serial,
                            end: serial,
                            serials: [serial],
                            startNumber: rangeData.startNumber,
                            endNumber: rangeData.endNumber
                        });
                    }
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

export const generateSummary = (selectedTickets, selectedPrice) => {
    return useMemo(() => {
        const summary = createTicketSummary(selectedTickets, selectedPrice);
        const groupedSummary = processSummaryIntoGroups(summary);
        return createFinalSummary(groupedSummary);
    }, [selectedTickets, selectedPrice]);
};