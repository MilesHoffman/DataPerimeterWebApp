import { createTheme } from '@mui/material/styles';

const globalTheme = createTheme({
	palette: {
		background: {
			default: '#f9fafa', // A very light grey, almost white, similar to some AWS backgrounds
		},
		primary: {
			main: '#232f3e', // Dark blue/grey, common in AWS headers and footers.  Good for primary buttons, etc.
			light: '#D9D9D9'
		},
		secondary: {
			main: '#ff9900', // AWS Orange - use sparingly as an accent color for calls to action, highlights, etc.
		},
		// Add error, warning, info, and success colors if needed.  Here are some suggestions:
		error: {
			main: '#d50000', // A standard red for errors
		},
		warning: {
			main: '#ffb74d', // A slightly less intense orange for warnings
		},
		info: {
			main: '#2962ff', // A nice blue for informational messages
		},
		success: {
			main: '#4caf50', // A standard green for success messages
		},
		text: {
			primary: '#000000', // Dark grey for text, good contrast against the light background
			secondary: '#ffffff', // A lighter grey for secondary text, like subtitles or descriptions
		},
	},
	typography: {
		fontFamily: 'Roboto, sans-serif',
	},

	components: {
		MuiInputBase: {
			styleOverrides: {
				root: {
					'& input::placeholder': { // Target the placeholder in standard input
						color: 'rgba(0, 0, 0, 0.54)', // Example: A semi-transparent black
						opacity: 1, // Firefox issue
					},
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: 'rgba(0, 0, 0, 0.23)', // Example: Default border color
					},
					'&:hover .MuiOutlinedInput-notchedOutline': {
						borderColor: '#232f3e', // Example: Your primary color on hover
					},
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: '#ff9900', // Example: Your secondary color when focused
						borderWidth: '2px', // Example: Increase border width on focus
					},
				},
			},
		},
		MuiInputLabel: {
			styleOverrides: {
				root: {
					color: '#000000'
				},
			},
		},
	}

});

export default globalTheme;