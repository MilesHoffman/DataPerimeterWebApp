import { useState } from 'react';
import { TextField, Button, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function DynamicTextFieldList({ values, setValues, textBoxLabels }) {
	const handleAddTextField = () => {
		setValues([...values, '']);
	};

	const handleTextFieldChange = (index, event) => {
		const newValues = [...values];
		newValues[index] = event.target.value;
		setValues(newValues);
	};

	const handleDeleteTextField = (index) => {
		const newValues = values.filter((_, i) => i!== index);
		setValues(newValues);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column', // Arrange items in a column
				alignItems: 'center',   // Center horizontally
				justifyContent: 'center' // Center vertically (if needed)
			}}
		>
			{values.map((value, index) => (
				<Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1, width: '100%', maxWidth: 300 }}> {/* Added width and maxWidth */}
					<TextField
						label={`${textBoxLabels} ${index + 1}`}
						variant="outlined"
						value={value}
						onChange={(event) => handleTextFieldChange(index, event)}
						sx={{ width: '100%', marginRight: 1 }} // TextField takes full width of parent
					/>
					<IconButton onClick={() => handleDeleteTextField(index)} aria-label="delete">
						<CloseIcon />
					</IconButton>
				</Box>
			))}
			<Button variant="contained" onClick={handleAddTextField} sx={{ mt: 1, width: 300 }}> {/* Button width */}
				Add Text Field
			</Button>
		</Box>
	);
}