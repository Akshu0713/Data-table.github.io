import React, { useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Box, IconButton, TextField, Drawer, Typography, MenuItem, Select, Slider, Button, Stack, FormControlLabel, Checkbox
} from '@mui/material';
import { Search, Visibility, FilterList, Group } from '@mui/icons-material';
import sampleData from '../sampledata.json';
import moment from 'moment';
import Fuse from 'fuse.js';

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
  }),
  columnHelper.accessor('name', {
    header: 'Name',
  }),
  columnHelper.accessor('category', {
    header: 'Category',
  }),
  columnHelper.accessor('subcategory', {
    header: 'Subcategory',
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    filterFn: 'between',
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created At',
    cell: (info) => moment(info.getValue()).format('DD-MMM-YYYY HH:mm'),
  }),
  columnHelper.accessor('updatedAt', {
    header: 'Updated At',
    cell: (info) => moment(info.getValue()).format('DD-MMM-YYYY HH:mm'),
  }),
];

const Table = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce((acc, col) => {
      acc[col.id] = true; // Initialize all columns as visible
      return acc;
    }, {})
  );
  const [tempColumnVisibility, setTempColumnVisibility] = useState(columnVisibility);
  const [filters, setFilters] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [groupBy, setGroupBy] = useState([]);
  const [tempGroupBy, setTempGroupBy] = useState([]);

  const fuse = useMemo(() => new Fuse(sampleData, {
    keys: ['name'],
    threshold: 0.3,
  }), []);

  const data = useMemo(() => {
    if (globalFilter) {
      return fuse.search(globalFilter).map(({ item }) => item);
    }
    return sampleData;
  }, [globalFilter, fuse]);

  const handleSearch = (e) => {
    setGlobalFilter(e.target.value);
  };

  const handleColumnVisibility = (columnId) => {
    setTempColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleFilter = (columnId, value) => {
    setFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }));
  };

  const toggleDrawer = (content) => {
    setDrawerContent(content);
    setDrawerOpen(!drawerOpen);
  };

  const handleGroupChange = (e) => {
    setTempGroupBy(e.target.value);
  };

  const handleGroupApply = () => {
    setGroupBy(tempGroupBy);
    toggleDrawer(null);
  };

  const handleGroupCancel = () => {
    setTempGroupBy([]);
    toggleDrawer(null);
  };

  const handleColumnApply = () => {
    setColumnVisibility(tempColumnVisibility);
    toggleDrawer(null);
  };

  const handleShowAllColumns = () => {
    const allVisible = columns.reduce((acc, col) => {
      acc[col.id] = true;
      return acc;
    }, {});
    setTempColumnVisibility(allVisible);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search"
          value={globalFilter}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search />,
          }}
        />
        <Box>
          <IconButton onClick={() => toggleDrawer('columns')}>
            <Visibility />
          </IconButton>
          <IconButton onClick={() => toggleDrawer('filters')}>
            <FilterList />
          </IconButton>
          <IconButton onClick={() => toggleDrawer('group')}>
            <Group />
          </IconButton>
        </Box>
      </Box>

      <MaterialReactTable
        columns={columns}
        data={data}
        state={{ globalFilter, columnVisibility, filters, grouping: groupBy }}
        enableColumnVisibility
        enableFilters
        enableSorting
        enablePagination
        enableRowSelection
        enableGrouping
        initialState={{ pagination: { pageSize: 10 } }}
      />

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawerContent === 'columns' && (
          <Box p={2}>
            <Typography variant="h6">View/Hide Columns</Typography>
            <Button variant="contained" color="primary" onClick={handleShowAllColumns}>
              Show All Columns
            </Button>
            {columns.map((column) => (
              <div key={column.id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!tempColumnVisibility[column.id]}
                      onChange={() => handleColumnVisibility(column.id)}
                    />
                  }
                  label={column.header}
                />
              </div>
            ))}
            <Button variant="contained" color="primary" onClick={handleColumnApply}>
              Apply
            </Button>
          </Box>
        )}
        {drawerContent === 'filters' && (
          <Box p={2}>
            <Typography variant="h6">Filters</Typography>
            {columns.map((column) => (
              <div key={column.id}>
                {column.id === 'name' && (
                  <>
                    <label>{column.header} (Fuzzy Search)</label>
                    <TextField
                      variant="outlined"
                      size="small"
                      onChange={(e) => handleFilter(column.id, e.target.value)}
                    />
                  </>
                )}
                {(column.id === 'category' || column.id === 'subcategory') && (
                  <>
                    <label>{column.header}</label>
                    <Select
                      multiple
                      value={filters[column.id] || []}
                      onChange={(e) => handleFilter(column.id, e.target.value)}
                    >
                      {[...new Set(data.map((item) => item[column.id]))].map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                )}
                {column.id === 'price' && (
                  <>
                    <label>{column.header} (Range Filter)</label>
                    <Slider
                      value={filters[column.id] || [0, 1000]}
                      onChange={(e, value) => handleFilter(column.id, value)}
                      valueLabelDisplay="auto"
                      min={Math.min(...data.map((item) => item[column.id]))}
                      max={Math.max(...data.map((item) => item[column.id]))}
                    />
                  </>
                )}
                {column.id === 'createdAt' && (
                  <>
                    <label>{column.header} (Date Range Filter)</label>
                    <TextField
                      type="date"
                      onChange={(e) => handleFilter(column.id, { ...filters[column.id], start: e.target.value })}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    <TextField
                      type="date"
                      onChange={(e) => handleFilter(column.id, { ...filters[column.id], end: e.target.value })}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </>
                )}
              </div>
            ))}
            <Stack direction="row" spacing={2} mt={2}>
              <Button variant="contained" color="primary" onClick={handleGroupApply}>Apply Grouping Changes</Button>
              <Button variant="outlined" color="secondary" onClick={handleGroupCancel}>Cancel Grouping</Button>
            </Stack>
          </Box>
        )}
        {drawerContent === 'group' && (
          <Box p={2}>
            <Typography variant="h6">Group By</Typography>
            <Select
              multiple
              value={tempGroupBy}
              onChange={handleGroupChange}
            >
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="subcategory">Subcategory</MenuItem>
            </Select>
            <Stack direction="row" spacing={2} mt={2}>
              <Button variant="contained" color="primary" onClick={handleGroupApply}>Change</Button>
              <Button variant="outlined" color="secondary" onClick={handleGroupCancel}>Cancel</Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default Table;
