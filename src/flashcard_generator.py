"""
Flashcard Generator for Interactive HTML Flashcards
Creates beautiful, interactive flashcard viewers that open automatically in browser
"""

import json
import webbrowser
from pathlib import Path
from typing import List, Dict, Any


class FlashcardGenerator:
    def __init__(self):
        """Initialize the flashcard generator"""
        pass
    
    def create_flashcard_html(self, flashcards: List[Dict[str, str]], filename: str = "interactive_flashcards.html") -> str:
        """
        Create an interactive HTML flashcard viewer
        
        Args:
            flashcards: List of flashcard dictionaries with 'front' and 'back' keys
            filename: Output HTML filename
            
        Returns:
            Path to the created HTML file
        """
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Flashcards</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
        }}
        
        .header {{
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }}
        
        .stats {{
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            color: white;
            text-align: center;
            backdrop-filter: blur(10px);
        }}
        
        .card {{
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        
        .card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }}
        
        .card-content {{
            padding: 40px;
            text-align: center;
            width: 100%;
        }}
        
        .front {{
            display: block;
        }}
        
        .back {{
            display: none;
            background: #f8f9fa;
        }}
        
        .flipped .front {{
            display: none;
        }}
        
        .flipped .back {{
            display: block;
        }}
        
        .question {{
            font-size: 1.5em;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
            line-height: 1.4;
        }}
        
        .answer {{
            font-size: 1.2em;
            color: #555;
            line-height: 1.6;
        }}
        
        .controls {{
            text-align: center;
            margin: 30px 0;
        }}
        
        .btn {{
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 10px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }}
        
        .btn:hover {{
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }}
        
        .btn-secondary {{
            background: #6c757d;
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }}
        
        .btn-secondary:hover {{
            background: #5a6268;
            box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
        }}
        
        .progress {{
            background: rgba(255, 255, 255, 0.2);
            height: 8px;
            border-radius: 4px;
            margin: 20px 0;
            overflow: hidden;
        }}
        
        .progress-bar {{
            background: linear-gradient(90deg, #4CAF50, #45a049);
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
        }}
        
        .card-counter {{
            color: white;
            text-align: center;
            margin: 20px 0;
            font-size: 1.1em;
        }}
        
        .flip-hint {{
            color: rgba(255, 255, 255, 0.8);
            text-align: center;
            font-style: italic;
            margin-bottom: 20px;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 10px;
            }}
            
            .card-content {{
                padding: 20px;
            }}
            
            .question {{
                font-size: 1.3em;
            }}
            
            .answer {{
                font-size: 1.1em;
            }}
            
            .btn {{
                margin: 5px;
                padding: 10px 20px;
                font-size: 14px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Interactive Flashcards</h1>
            <p>Click on cards to flip them and test your knowledge!</p>
        </div>
        
        <div class="stats">
            <div>Total Cards: <span id="total-cards">0</span> | 
                 Studied: <span id="studied-cards">0</span> | 
                 Remaining: <span id="remaining-cards">0</span></div>
        </div>
        
        <div class="progress">
            <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
        </div>
        
        <div class="flip-hint">
            💡 Click any card to flip it and reveal the answer
        </div>
        
        <div class="controls">
            <button class="btn" onclick="shuffleCards()">🔀 Shuffle</button>
            <button class="btn btn-secondary" onclick="resetCards()">🔄 Reset</button>
            <button class="btn btn-secondary" onclick="exportProgress()">💾 Save Progress</button>
        </div>
        
        <div class="card-counter">
            <span id="current-card">1</span> of <span id="total-cards-display">0</span>
        </div>
        
        <div id="cards-container">
            <!-- Cards will be inserted here -->
        </div>
    </div>

    <script>
        let flashcards = {json.dumps(flashcards)};
        let currentIndex = 0;
        let studiedCards = new Set();
        
        function initCards() {{
            const container = document.getElementById('cards-container');
            container.innerHTML = '';
            
            flashcards.forEach((card, index) => {{
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.onclick = () => flipCard(cardElement, index);
                
                cardElement.innerHTML = `
                    <div class="card-content front">
                        <div class="question">${{card.front}}</div>
                    </div>
                    <div class="card-content back">
                        <div class="answer">${{card.back}}</div>
                    </div>
                `;
                
                container.appendChild(cardElement);
            }});
            
            updateStats();
        }}
        
        function flipCard(cardElement, index) {{
            cardElement.classList.toggle('flipped');
            if (cardElement.classList.contains('flipped')) {{
                studiedCards.add(index);
                updateStats();
            }}
        }}
        
        function updateStats() {{
            const total = flashcards.length;
            const studied = studiedCards.size;
            const remaining = total - studied;
            
            document.getElementById('total-cards').textContent = total;
            document.getElementById('studied-cards').textContent = studied;
            document.getElementById('remaining-cards').textContent = remaining;
            document.getElementById('total-cards-display').textContent = total;
            
            const progress = total > 0 ? (studied / total) * 100 : 0;
            document.getElementById('progress-bar').style.width = progress + '%';
        }}
        
        function shuffleCards() {{
            for (let i = flashcards.length - 1; i > 0; i--) {{
                const j = Math.floor(Math.random() * (i + 1));
                [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
            }}
            initCards();
        }}
        
        function resetCards() {{
            studiedCards.clear();
            document.querySelectorAll('.card').forEach(card => {{
                card.classList.remove('flipped');
            }});
            updateStats();
        }}
        
        function exportProgress() {{
            const progress = {{
                studied: Array.from(studiedCards),
                timestamp: new Date().toISOString(),
                totalCards: flashcards.length
            }};
            
            const blob = new Blob([JSON.stringify(progress, null, 2)], {{type: 'application/json'}});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flashcard_progress.json';
            a.click();
            URL.revokeObjectURL(url);
        }}
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initCards);
    </script>
</body>
</html>
        """
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return filename
    
    def generate_and_open_flashcards(self, flashcards: List[Dict[str, str]], filename: str = "interactive_flashcards.html") -> str:
        """
        Generate HTML flashcards and open them in browser
        
        Args:
            flashcards: List of flashcard dictionaries
            filename: Output HTML filename
            
        Returns:
            Path to the created HTML file
        """
        html_file = self.create_flashcard_html(flashcards, filename)
        
        # Open in browser automatically
        file_path = Path(html_file).absolute()
        webbrowser.open(f"file://{file_path}")
        
        return str(file_path)
