import React, {useState} from 'react';
import {Pagination} from 'react-bootstrap';

type PaginatorProps = {
    pageNumber: number;
    onChange: (pageNumber: number) => void;
}

export const Paginator = (props: PaginatorProps) => {
    const [pageRangeSize, setPageRangeSize] = useState<number>(6);
    const [pageRangeStart, setPageRangeStart] = useState<number>(1);
    const [pageRangeEnd, setPageRangeEnd] = useState<number>(pageRangeStart + (pageRangeSize - 1));

    const onSetPageNumber = (pageNumber: number) => {
        props.onChange(pageNumber);
    }

    const onPreviousPage = () => {
        const nextPageNumber = Math.max(props.pageNumber - 1, 1);
        updatePageRange(nextPageNumber);
        onSetPageNumber(nextPageNumber);
    }

    const onNextPage = () => {
        const nextPageNumber = props.pageNumber + 1;
        updatePageRange(nextPageNumber);
        onSetPageNumber(nextPageNumber);
    }

    const updatePageRange = (nextPageNumber: number) => {
        if(nextPageNumber < pageRangeStart) {
            setPageRangeStart(nextPageNumber);
            setPageRangeEnd(nextPageNumber + (pageRangeSize - 1));
        }

        if(nextPageNumber > pageRangeEnd) {
            setPageRangeEnd(nextPageNumber);
            setPageRangeStart(nextPageNumber - (pageRangeSize - 1));
        }
    }


    let items = [];
    for (let p = pageRangeStart; p <= pageRangeEnd; p++) {
        items.push(
        <Pagination.Item key={p} active={p === props.pageNumber} onClick={() => onSetPageNumber(p)}>
        {p}
        </Pagination.Item>,
        );
    }

    return (
        <Pagination>
            <Pagination.Prev onClick={() => {onPreviousPage()}}/>
            {items}
            <Pagination.Next onClick={() => {onNextPage()}}/>
        </Pagination>
    )
}
