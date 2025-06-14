const MIN_RADIUS = 7.5;
const MAX_RADIUS = 15;
const DEPTH = 1;
// Elegant violet color palette
const OUTER_LEFT_COLOR = "8B5CF6"; // Light violet
const OUTER_RIGHT_COLOR = "A855F7"; // Medium violet
// Inner violet shades
const INNER_LEFT_COLOR = "6D28D9"; // Deep violet
const INNER_RIGHT_COLOR = "7C3AED"; // Rich violet
const NUM_POINTS = 1500; // Reduced from 8000 for less density

/**
 * --- Credit ---
 * https://stackoverflow.com/questions/16360533/calculate-color-hex-having-2-colors-and-percent-position
 */
const getGradientStop = (ratio, leftColor, rightColor) => {
    // For outer ring numbers potentially past max radius,
    // just clamp to 0
    ratio = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;

    const c0 = leftColor.match(/.{1,2}/g).map(
    (oct) => parseInt(oct, 16) * (1 - ratio)
    );
    const c1 = rightColor.match(/.{1,2}/g).map(
    (oct) => parseInt(oct, 16) * ratio
    );
    const ci = [0, 1, 2].map((i) => Math.min(Math.round(c0[i] + c1[i]), 255));
    const color = ci
    .reduce((a, v) => (a << 8) + v, 0)
    .toString(16)
    .padStart(6, "0");

    return `#${color}`;
};

export const calculateColor = (x, outer = false, minX = -MAX_RADIUS, maxX = MAX_RADIUS) => {
    const maxDiff = maxX - minX;
    const distance = x - minX;

    const ratio = maxDiff > 0 ? distance / maxDiff : 0;

    const stop = outer ? getGradientStop(ratio, OUTER_LEFT_COLOR, OUTER_RIGHT_COLOR) : getGradientStop(ratio, INNER_LEFT_COLOR, INNER_RIGHT_COLOR);
    return stop;
};

const randomFromInterval = (min, max) => {
    return Math.random() * (max - min) + min;
};

export const pointsOuter = Array.from(
    { length: NUM_POINTS / 8 },
    (v, k) => k + 1
).map((num) => {
    const randomRadius = randomFromInterval(MIN_RADIUS * 4, MAX_RADIUS * 6);
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * randomRadius;
    const y = Math.sin(angle) * randomRadius;
    const z = randomFromInterval(-DEPTH * 40, DEPTH * 40);

    const color = calculateColor(x, true);

    return {
    idx: num,
    position: [x, y, z],
    color,
    };
});

export const generateFPoints = () => {
    const points = [];
    let idx = 1;
    
    // F dimensions
    const F_HEIGHT = 10;
    const F_WIDTH = 6;
    const VERTICAL_LINE_X = -6; // Left side of the F
    const TOP_LINE_Y = F_HEIGHT / 2;
    const MIDDLE_LINE_Y = 2;
    const BOTTOM_Y = -F_HEIGHT / 2;
    const MIDDLE_LINE_WIDTH = F_WIDTH * 0.8; // Middle line is shorter
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate vertical line (left side of F)
    for (let y = BOTTOM_Y; y <= TOP_LINE_Y; y += POINT_SPACING) {
        // Add some random variation for organic look
        const x = VERTICAL_LINE_X + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate top horizontal line
    for (let x = VERTICAL_LINE_X - 0.5; x <= VERTICAL_LINE_X + F_WIDTH; x += POINT_SPACING) {
        const y = TOP_LINE_Y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate middle horizontal line (shorter)
    for (let x = VERTICAL_LINE_X; x <= VERTICAL_LINE_X + MIDDLE_LINE_WIDTH; x += POINT_SPACING) {
        const y = MIDDLE_LINE_Y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    return points;
};

export const generateUPoints = () => {
    const points = [];
    let idx = 1;
    
    // U dimensions
    const U_HEIGHT = 10;
    const U_WIDTH = 6;
    const LEFT_X = -6; // Left side of the U
    const RIGHT_X = LEFT_X + U_WIDTH; // Right side of the U
    const TOP_Y = U_HEIGHT / 2;
    const BOTTOM_Y = -U_HEIGHT / 2;
    const CURVE_HEIGHT = U_HEIGHT * 0.4; // How much of the bottom is curved
    const CURVE_START_Y = BOTTOM_Y + CURVE_HEIGHT; // Where the curve starts
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate left vertical line (from top to where curve starts)
    for (let y = TOP_Y; y >= CURVE_START_Y; y -= POINT_SPACING) {
        const x = LEFT_X + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate right vertical line (from top to where curve starts)
    for (let y = TOP_Y; y >= CURVE_START_Y; y -= POINT_SPACING) {
        const x = RIGHT_X + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate curved bottom section using a parabolic curve
    // The curve goes from left side to right side
    const centerX = (LEFT_X + RIGHT_X) / 2;
    const curveWidth = RIGHT_X - LEFT_X;
    
    for (let x = LEFT_X; x <= RIGHT_X; x += POINT_SPACING / 2) {
        // Parabolic function: y = a * (x - centerX)^2 + bottom
        // We want the curve to start at CURVE_START_Y at the edges and go down to BOTTOM_Y at center
        const normalizedX = (x - centerX) / (curveWidth / 2); // Normalize to [-1, 1]
        const curveDepth = CURVE_START_Y - BOTTOM_Y;
        const y = CURVE_START_Y - curveDepth * (1 - normalizedX * normalizedX);
        
        const adjustedX = x + randomFromInterval(-1, 0.5);
        const adjustedY = y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [adjustedX, adjustedY, z],
        });
    }
    
    return points;
};

export const generateTPoints = () => {
    const points = [];
    let idx = 1;
    
    // T dimensions
    const T_HEIGHT = 10;
    const T_WIDTH = 8;
    const CENTER_X = 0; // Center the T
    const TOP_Y = T_HEIGHT / 2;
    const BOTTOM_Y = -T_HEIGHT / 2;
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate top horizontal line
    for (let x = CENTER_X - T_WIDTH / 2; x <= CENTER_X + T_WIDTH / 2; x += POINT_SPACING) {
        const y = TOP_Y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate vertical line (center stem)
    for (let y = TOP_Y; y >= BOTTOM_Y; y -= POINT_SPACING) {
        const x = CENTER_X + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    return points;
};

export const generateRPoints = () => {
    const points = [];
    let idx = 1;
    
    // R dimensions
    const R_HEIGHT = 10;
    const R_WIDTH = 6;
    const LEFT_X = -6;
    const RIGHT_X = LEFT_X + R_WIDTH;
    const TOP_Y = R_HEIGHT / 2;
    const BOTTOM_Y = -R_HEIGHT / 2;
    const MIDDLE_Y = 1;
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate left vertical line
    for (let y = BOTTOM_Y; y <= TOP_Y; y += POINT_SPACING) {
        const x = LEFT_X + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate top horizontal line
    for (let x = LEFT_X - 0.1; x <= RIGHT_X; x += POINT_SPACING) {
        const y = TOP_Y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate middle horizontal line
    for (let x = LEFT_X; x <= RIGHT_X * 0.8; x += POINT_SPACING) {
        const y = MIDDLE_Y + randomFromInterval(-1, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate right vertical line (top half only)
    for (let y = MIDDLE_Y; y <= TOP_Y; y += POINT_SPACING) {
        const x = RIGHT_X + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate diagonal line (from middle-right to bottom-right)
    const diagonalSteps = Math.abs(BOTTOM_Y - MIDDLE_Y) / POINT_SPACING;
    const diagonalXStep = (RIGHT_X - (LEFT_X + R_WIDTH * 0.1)) / diagonalSteps;
    
    for (let i = 0; i <= diagonalSteps; i += 0.8) {
        const x = LEFT_X + R_WIDTH * 0.1 + (diagonalXStep * i) + randomFromInterval(-0.4, 0.6);
        const y = MIDDLE_Y - (i * POINT_SPACING) + randomFromInterval(-0.4, 0.6);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    return points;
};

export const generateOPoints = () => {
    const points = [];
    let idx = 1;
    
    // O dimensions
    const O_WIDTH = 6;
    const O_HEIGHT = 10;
    const CENTER_X = 0;
    const CENTER_Y = 0;
    const OUTER_RADIUS_X = O_WIDTH / 2;
    const OUTER_RADIUS_Y = O_HEIGHT / 2;
    const INNER_RADIUS_X = OUTER_RADIUS_X * 0.8; // Inner hole
    const INNER_RADIUS_Y = OUTER_RADIUS_Y * 0.8;
    
    // Density of points
    const ANGLE_STEP = 0.01;
    
    // Generate outer ellipse
    for (let angle = 0; angle < Math.PI * 2; angle += ANGLE_STEP) {
        const x = CENTER_X + Math.cos(angle) * OUTER_RADIUS_X + randomFromInterval(-0.5, 0.5);
        const y = CENTER_Y + Math.sin(angle) * OUTER_RADIUS_Y + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate inner ellipse (for thickness)
    for (let angle = 0; angle < Math.PI * 2; angle += ANGLE_STEP) {
        const x = CENTER_X + Math.cos(angle) * INNER_RADIUS_X + randomFromInterval(-0.5, 0.5);
        const y = CENTER_Y + Math.sin(angle) * INNER_RADIUS_Y + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Fill the ring between inner and outer ellipse
    const RADIAL_STEPS = 20;
    for (let angle = 0; angle < Math.PI * 2; angle += ANGLE_STEP * 2) {
        for (let r = 0; r <= RADIAL_STEPS; r++) {
            const ratio = r / RADIAL_STEPS;
            const currentRadiusX = INNER_RADIUS_X + (OUTER_RADIUS_X - INNER_RADIUS_X) * ratio;
            const currentRadiusY = INNER_RADIUS_Y + (OUTER_RADIUS_Y - INNER_RADIUS_Y) * ratio;
            
            const x = CENTER_X + Math.cos(angle) * currentRadiusX + randomFromInterval(-0.3, 0.3);
            const y = CENTER_Y + Math.sin(angle) * currentRadiusY + randomFromInterval(-0.3, 0.3);
            const z = randomFromInterval(-DEPTH, DEPTH);
            
            points.push({
                idx: idx++,
                position: [x, y, z],
            });
        }
    }
    
    return points;
};

export const generateVPoints = () => {
    const points = [];
    let idx = 1;
    
    // V dimensions
    const V_HEIGHT = 10;
    const V_WIDTH = 8;
    const TOP_Y = V_HEIGHT / 2;
    const BOTTOM_Y = -V_HEIGHT / 2;
    const LEFT_TOP_X = -V_WIDTH / 2;
    const RIGHT_TOP_X = V_WIDTH / 2;
    const BOTTOM_CENTER_X = 0;
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate left diagonal line
    const leftSteps = V_HEIGHT / POINT_SPACING;
    const leftXStep = (BOTTOM_CENTER_X - LEFT_TOP_X) / leftSteps;
    
    for (let i = 0; i <= leftSteps; i++) {
        const x = LEFT_TOP_X + (leftXStep * i) + randomFromInterval(-0.5, 0.5);
        const y = TOP_Y - (i * POINT_SPACING) + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate right diagonal line
    const rightSteps = V_HEIGHT / POINT_SPACING;
    const rightXStep = (BOTTOM_CENTER_X - RIGHT_TOP_X) / rightSteps;
    
    for (let i = 0; i <= rightSteps; i++) {
        const x = RIGHT_TOP_X + (rightXStep * i) + randomFromInterval(-0.5, 0.5);
        const y = TOP_Y - (i * POINT_SPACING) + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    return points;
};

export const generateAPoints = () => {
    const points = [];
    let idx = 1;
    
    // A dimensions
    const A_HEIGHT = 10;
    const A_WIDTH = 8;
    const TOP_Y = A_HEIGHT / 2;
    const BOTTOM_Y = -A_HEIGHT / 2;
    const LEFT_BOTTOM_X = -A_WIDTH / 2;
    const RIGHT_BOTTOM_X = A_WIDTH / 2;
    const TOP_CENTER_X = 0;
    const CROSSBAR_Y = -1; // Horizontal crossbar position
    
    // Density of points
    const POINT_SPACING = 0.01;
    
    // Generate left diagonal line
    const leftSteps = A_HEIGHT / POINT_SPACING;
    const leftXStep = (TOP_CENTER_X - LEFT_BOTTOM_X) / leftSteps;
    
    for (let i = 0; i <= leftSteps; i++) {
        const x = LEFT_BOTTOM_X + (leftXStep * i) + randomFromInterval(-0.5, 0.5);
        const y = BOTTOM_Y + (i * POINT_SPACING) + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate right diagonal line
    const rightSteps = A_HEIGHT / POINT_SPACING;
    const rightXStep = (TOP_CENTER_X - RIGHT_BOTTOM_X) / rightSteps;
    
    for (let i = 0; i <= rightSteps; i++) {
        const x = RIGHT_BOTTOM_X + (rightXStep * i) + randomFromInterval(-0.5, 0.5);
        const y = BOTTOM_Y + (i * POINT_SPACING) + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    // Generate horizontal crossbar
    // Calculate the x positions where the crossbar intersects the diagonals
    const crossbarProgress = (CROSSBAR_Y - BOTTOM_Y) / A_HEIGHT;
    const leftCrossbarX = LEFT_BOTTOM_X + (leftXStep * (crossbarProgress * leftSteps));
    const rightCrossbarX = RIGHT_BOTTOM_X + (rightXStep * (crossbarProgress * rightSteps));
    
    for (let x = leftCrossbarX; x <= rightCrossbarX; x += POINT_SPACING) {
        const y = CROSSBAR_Y + randomFromInterval(-0.5, 0.5);
        const z = randomFromInterval(-DEPTH, DEPTH);
        
        points.push({
            idx: idx++,
            position: [x, y, z],
        });
    }
    
    return points;
};

export const generateResponsiveOuterPoints = () => {
    const numPoints = NUM_POINTS / 8; // Significantly reduce points on mobile
    const minRadius = MIN_RADIUS * 4;
    const maxRadius = MAX_RADIUS * 6;
    const depth = DEPTH * 40;

    return Array.from(
        { length: numPoints },
        (v, k) => k + 1
    ).map((num) => {
        const randomRadius = randomFromInterval(minRadius, maxRadius);
        const angle = Math.random() * Math.PI * 2;

        const x = Math.cos(angle) * randomRadius;
        const y = Math.sin(angle) * randomRadius;
        const z = randomFromInterval(-depth, depth);

        const color = calculateColor(x, true);

        return {
            idx: num,
            position: [x, y, z],
            color,
        };
    });
};