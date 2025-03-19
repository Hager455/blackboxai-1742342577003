import { extendTheme } from '@chakra-ui/react';

const config = {
    initialColorMode: 'light',
    useSystemColorMode: false,
};

const colors = {
    brand: {
        50: '#E6F6FF',
        100: '#BAE3FF',
        200: '#7CC4FA',
        300: '#47A3F3',
        400: '#2186EB',
        500: '#0967D2',
        600: '#0552B5',
        700: '#03449E',
        800: '#01337D',
        900: '#002159',
    },
};

const components = {
    Button: {
        baseStyle: {
            fontWeight: 'semibold',
            borderRadius: 'lg',
        },
        variants: {
            solid: (props) => ({
                bg: props.colorMode === 'dark' ? 'brand.200' : 'brand.500',
                color: 'white',
                _hover: {
                    bg: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
                },
            }),
            outline: (props) => ({
                borderColor: props.colorMode === 'dark' ? 'brand.200' : 'brand.500',
                color: props.colorMode === 'dark' ? 'brand.200' : 'brand.500',
                _hover: {
                    bg: props.colorMode === 'dark' ? 'brand.900' : 'brand.50',
                },
            }),
        },
    },
    Card: {
        baseStyle: {
            container: {
                borderRadius: 'lg',
                boxShadow: 'base',
            },
        },
    },
};

const fonts = {
    heading: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
};

const styles = {
    global: (props) => ({
        body: {
            bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
            color: props.colorMode === 'dark' ? 'white' : 'gray.800',
        },
    }),
};

const theme = extendTheme({
    config,
    colors,
    components,
    fonts,
    styles,
    shadows: {
        outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
    },
    radii: {
        button: '0.5rem',
    },
});

export default theme;
