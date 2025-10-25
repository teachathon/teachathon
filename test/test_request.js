import fetch from 'node-fetch';

const data = {
    user_email: 'dhyey.mehta2022@gmail.com',
    num_mcq: 3,
    num_open: 1,
    messages: [
    { conv_id: 0, role: 'user', content: 'Can you explain the Pythagorean Theorem to me?' },
    { conv_id: 0, role: 'assistant', content: 'Of course! The Pythagorean Theorem states that in a right-angled triangle, the square of the hypotenuse (the longest side opposite the right angle) equals the sum of the squares of the other two sides. We write it as a² + b² = c², where c is the hypotenuse.' },
    { conv_id: 0, role: 'user', content: 'Why is it called the Pythagorean Theorem?' },
    { conv_id: 0, role: 'assistant', content: 'It is named after Pythagoras, an ancient Greek mathematician and philosopher who lived around 570-495 BCE. While he is credited with the theorem, evidence suggests that Babylonian mathematicians knew about this relationship centuries earlier!' },
    { conv_id: 0, role: 'user', content: 'Really? So Pythagoras did not discover it?' },
    { conv_id: 0, role: 'assistant', content: 'He may not have been the first to discover it, but he and his followers, the Pythagoreans, were likely the first to provide a mathematical proof. That is why his name stuck with the theorem.' },
    { conv_id: 0, role: 'user', content: 'Interesting! Can you give me an example of how to use it?' },
    { conv_id: 0, role: 'assistant', content: 'Sure! Imagine you have a right triangle where one side is 3 units and another is 4 units. To find the hypotenuse, you calculate: 3² + 4² = 9 + 16 = 25. Then take the square root: √25 = 5. So the hypotenuse is 5 units.' },
    { conv_id: 0, role: 'user', content: 'That makes sense. Are there special triangles that follow this pattern?' },
    { conv_id: 0, role: 'assistant', content: 'Yes! These are called Pythagorean triples. The most common ones are (3, 4, 5), (5, 12, 13), and (8, 15, 17). Any multiple of these also works, like (6, 8, 10) or (9, 12, 15).' },
    { conv_id: 0, role: 'user', content: 'Cool! Where is this theorem used in real life?' },
    { conv_id: 0, role: 'assistant', content: 'The Pythagorean Theorem has many practical applications! Architects use it to ensure buildings have right angles. Engineers use it in construction and design. Navigation systems use it to calculate distances. Even in computer graphics, it helps calculate distances between points on a screen.' },
    { conv_id: 0, role: 'user', content: 'What about in carpentry?' },
    { conv_id: 0, role: 'assistant', content: 'Absolutely! Carpenters use the 3-4-5 rule to check if corners are square. They measure 3 feet along one wall, 4 feet along another, and if the diagonal is exactly 5 feet, they know the corner is a perfect 90-degree angle.' },
    { conv_id: 0, role: 'user', content: 'Does it only work for right triangles?' },
    { conv_id: 0, role: 'assistant', content: 'Yes, it only works for right triangles. For other triangles, we use different formulas like the Law of Cosines or the Law of Sines. The Pythagorean Theorem is a special case that applies specifically when one angle is exactly 90 degrees.' },
    { conv_id: 0, role: 'user', content: 'What happens if I try to use it on a triangle without a right angle?' },
    { conv_id: 0, role: 'assistant', content: 'The equation would not hold true. For example, in an equilateral triangle with all sides equal to 5, if you tried a² + b² = c², you would get 5² + 5² = 50, but the third side is only 5, so 5² = 25. The relationship breaks down because there is no right angle.' },
    { conv_id: 0, role: 'user', content: 'Are there any variations or extensions of this theorem?' },
    { conv_id: 0, role: 'assistant', content: 'Yes! There is a 3D version called the 3D distance formula: d² = x² + y² + z². It extends the theorem to three-dimensional space. There is also Fermat Last Theorem, which states that no three positive integers satisfy aⁿ + bⁿ = cⁿ for any integer n greater than 2. This remained unproven for 358 years until Andrew Wiles proved it in 1995!' },
    { conv_id: 0, role: 'user', content: 'Wow, that is fascinating! Thanks for explaining all of this.' },
    { conv_id: 0, role: 'assistant', content: 'You are welcome! The Pythagorean Theorem is one of the most fundamental and beautiful relationships in mathematics. It connects geometry, algebra, and has countless real-world applications. Keep exploring math - there is always more to discover!' }
]
};

async function testRequest() {
    try {
        console.log('Sending test request to server...');
        console.log(`Email: ${data.user_email}`);
        console.log(`Questions: ${data.num_mcq} MCQ + ${data.num_open} open-ended`);
        console.log('');
        
        const response = await fetch('http://127.0.0.1:8000/receive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Status:', response.status); // Should be 200
        const result = await response.json();
        console.log('Response:', result); // {"status": "ok"}
        
        if (result.status === 'ok') {
            console.log('');
            console.log('SUCCESS! Quiz generation started.');
            console.log('Check your email for the Google Form link.');
        }
    } catch (error) {
        console.error('Request failed:', error.message);
        console.log('');
        console.log('Make sure the server is running: npm start');
    }
}
testRequest();
