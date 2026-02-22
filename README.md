# 🃏 Blackjack Trainer

A comprehensive web-based Blackjack training application designed to help players master basic strategy and card counting techniques. This trainer grades your first decision in each hand against optimal basic strategy and includes a complete Hi-Lo card counting system with coach mode.

![Screenshot Placeholder](./screenshots/main-interface.png)

> _Add a screenshot of the main game interface here_

## ✨ Features

### 🎯 Basic Strategy Training

- **First Decision Grading**: Each hand grades only your initial decision against optimal basic strategy
- **Instant Feedback**: Get immediate explanations for correct and incorrect decisions
- **Performance Tracking**: Monitor your accuracy, current streak, and best streak
- **Persistent Statistics**: Stats are saved in browser localStorage

### 📊 Card Counting (Hi-Lo System)

- **Running Count**: Real-time tracking of the Hi-Lo count
- **True Count**: Automatically calculated based on remaining decks
- **Decks Remaining**: Visual display of shoe penetration
- **Last Card Tracker**: See the last card dealt and its count value
- **Count Breakdown**: Detailed view of lows (2-6), neutrals (7-9), and highs (10-A) seen

### 🎓 Coach Mode

- **Betting Guidance**: Recommendations on bet sizing based on true count
- **Playing Deviations**: Suggestions for departing from basic strategy based on count (Illustrious 18)
- **Index Plays**: Specific situations where the count changes optimal strategy
- **Insurance Alerts**: Notifications when insurance becomes profitable (TC +3 or higher)

### 🎮 Full Gameplay

- **Pair Splitting**: Full support for splitting pairs with proper strategy
- **Doubling Down**: Double on any first two cards
- **Multi-Hand Display**: Visual representation of split hands
- **Dealer AI**: Follows standard casino rules (hits to 17, stands on all 17s)

## 🎲 Demo

**Live Demo**: Coming soon!

To run locally, see the [Quick Start](#-quick-start) section below.

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools or dependencies required!

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ZacksBroDev/BlackJack.git
   cd BlackJack
   ```

2. **Open in browser**

   ```bash
   # Option 1: Simply open the file
   open index.html

   # Option 2: Use a local server (recommended)
   python3 -m http.server 8000
   # Then visit http://localhost:8000

   # Option 3: Use VS Code Live Server extension
   # Right-click index.html and select "Open with Live Server"
   ```

3. **Start playing!**
   - Click "Deal" to start your first hand
   - Make your decision (Hit, Stand, Double, or Split)
   - Get instant feedback on your choice

## 📖 How to Use

### Basic Gameplay

1. **Start a Hand**: Click the "Deal" button to receive your initial two cards and see the dealer's upcard
2. **Make Your Decision**: Choose from available actions:
   - **Hit**: Take another card
   - **Stand**: Keep your current hand and end your turn
   - **Double**: Double your bet, receive exactly one more card, then stand
   - **Split**: If you have a pair, split into two separate hands
3. **Review Feedback**: Your first decision is graded against basic strategy
4. **Continue or Reset**: Click "Next Hand" to play again or "Reset Stats" to clear your performance data

### Card Counting

1. **Enable Counting**: The counting panel is visible by default
2. **Track the Count**:
   - Watch the running count update with each revealed card
   - Monitor the true count (running count ÷ decks remaining)
   - Review the count breakdown to see card distribution
3. **Use Coach Mode**:
   - Check the "Coach Mode" box for betting and strategy suggestions
   - See count-based playing deviations highlighted in real-time
   - Get alerts for favorable/unfavorable situations

### Understanding the Stats

- **Accuracy**: Percentage of first decisions that match basic strategy
- **Streak**: Current number of consecutive correct decisions
- **Best**: Your longest streak of correct decisions

## 🎰 Game Rules

This trainer uses standard casino rules:

- **Decks**: 6-deck shoe
- **Dealer**: Stands on all 17s including soft 17 (S17)
- **Splits**: Allowed on any pair
- **Double**: Allowed on any first two cards
- **Surrender**: Not available
- **Reshuffle**: Automatic when ≤52 cards remain (~1 deck)

## 📋 Basic Strategy Chart

The trainer grades your decisions based on the following basic strategy for **6 decks, S17, no surrender**:

![Strategy Chart Placeholder](./screenshots/strategy-chart.png)

> _Add a strategy chart image here_

### Hard Totals

| Your Hand | Dealer Upcard | Action            |
| --------- | ------------- | ----------------- |
| 5-8       | Any           | Hit               |
| 9         | 3-6           | Double (else Hit) |
| 10        | 2-9           | Double (else Hit) |
| 11        | 2-10          | Double (else Hit) |
| 12        | 4-6           | Stand (else Hit)  |
| 13-16     | 2-6           | Stand (else Hit)  |
| 17+       | Any           | Stand             |

### Soft Totals

| Your Hand | Dealer Upcard | Action              |
| --------- | ------------- | ------------------- |
| A,2-A,3   | 5-6           | Double (else Hit)   |
| A,4-A,5   | 4-6           | Double (else Hit)   |
| A,6       | 3-6           | Double (else Hit)   |
| A,7       | 2,7,8         | Stand               |
| A,7       | 3-6           | Double (else Stand) |
| A,7       | 9,10,A        | Hit                 |
| A,8-A,9   | Any           | Stand               |

### Pair Splitting

| Your Pair | Dealer Upcard            | Action             |
| --------- | ------------------------ | ------------------ |
| A,A       | Any                      | Split              |
| 2,2 / 3,3 | 2-7                      | Split (else Hit)   |
| 4,4       | 5-6                      | Split (else Hit)   |
| 5,5       | Never split (play as 10) |                    |
| 6,6       | 2-6                      | Split (else Hit)   |
| 7,7       | 2-7                      | Split (else Hit)   |
| 8,8       | Any                      | Split              |
| 9,9       | 2-9 except 7             | Split (else Stand) |
| 10,10     | Never split              | Stand              |

## 🎴 Card Counting (Hi-Lo System)

### How Hi-Lo Works

The Hi-Lo system assigns point values to cards:

- **Low cards (2-6)**: +1
- **Neutral cards (7-9)**: 0
- **High cards (10, J, Q, K, A)**: -1

### Running Count vs. True Count

- **Running Count**: The sum of all point values from dealt cards
- **True Count**: Running count divided by the number of decks remaining
- **Why True Count Matters**: Normalizes the advantage across different deck penetrations

### Using the Count

| True Count  | Betting Strategy           | Playing Strategy                     |
| ----------- | -------------------------- | ------------------------------------ |
| TC ≤ -2     | Bet minimum or leave table | Stick to basic strategy              |
| TC -1 to +1 | Standard bet               | Basic strategy                       |
| TC +2 to +3 | Increase bet 2-4x          | Consider some deviations             |
| TC +3 to +4 | Increase bet 4-6x          | Use playing deviations               |
| TC ≥ +5     | Increase bet 6-8x+         | Strong advantage, use all deviations |

### Playing Deviations (Illustrious 18 - Partial)

When coach mode is enabled, you'll see suggestions for these key deviations:

- **16 vs 10**: Stand when TC ≥ 0 (basic says hit)
- **15 vs 10**: Stand when TC ≥ +4 (basic says hit)
- **10 vs 10**: Double when TC ≥ +4 (basic says hit)
- **10 vs A**: Double when TC ≥ +4 (basic says hit)
- **12 vs 3**: Stand when TC ≥ +2 (basic says hit)
- **12 vs 2**: Stand when TC ≥ +3 (basic says hit)
- **13 vs 2**: Hit when TC ≤ -1 (basic says stand)
- **Insurance**: Take when TC ≥ +3 (basic says never)

## 🛠 Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS custom properties (variables)
  - Gradient backgrounds
  - Flexbox and Grid layouts
  - Responsive design
  - Dark theme with glassmorphism effects
- **Vanilla JavaScript (ES6+)**:
  - No frameworks or libraries
  - LocalStorage API for persistence
  - Array methods and modern syntax
  - Modular code organization

## 📁 Project Structure

```
BlackJack/
├── index.html          # Main HTML structure
├── style.css           # Complete styling and theme
├── app.js              # Game logic and card counting
├── README.md           # Documentation (this file)
└── screenshots/        # (Create this folder for images)
    ├── main-interface.png
    └── strategy-chart.png
```

### Key Code Components

**app.js** is organized into these main sections:

- **State Management**: Game state, shoe, hands, and counting state
- **Card/Shoe Logic**: Deck creation, shuffling, dealing
- **Basic Strategy**: Complete strategy matrix and recommendation engine
- **Card Counting**: Hi-Lo implementation with running/true count calculation
- **Gameplay Functions**: Hit, stand, double, split, dealer AI
- **UI Rendering**: Dynamic card display and state updates
- **Statistics**: Performance tracking with localStorage persistence

## 🔮 Future Features & Roadmap

Potential enhancements for future versions:

### Short-term

- [ ] Add sound effects and animations
- [ ] Implement bet sizing and bankroll simulation
- [ ] Add more detailed statistics (graphs, session history)
- [ ] Create a practice mode with hints before deciding
- [ ] Add keyboard shortcuts for actions

### Medium-term

- [ ] Multiple rule variations (different number of decks, H17 vs S17, DAS, etc.)
- [ ] Complete Illustrious 18 deviations
- [ ] Custom strategy charts for different rule sets
- [ ] Speed drill mode for rapid practice
- [ ] Achievement system and milestones

### Long-term

- [ ] True odds calculator showing exact probabilities
- [ ] Multi-player mode for practice sessions
- [ ] Backend integration for global leaderboards
- [ ] Mobile app versions (iOS/Android)
- [ ] Alternative counting systems (KO, Hi-Opt I/II, Omega II)
- [ ] Composition-dependent strategy for maximum accuracy

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/ZacksBroDev/BlackJack/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Enhancements

1. Open an issue with the "enhancement" label
2. Describe the feature and its benefits
3. Provide examples or mockups if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly in multiple browsers
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Maintain the existing code style
- Keep functions focused and well-documented
- Test in Chrome, Firefox, Safari, and Edge
- Ensure mobile responsiveness
- Update README if adding new features

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2026 ZacksBroDev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👤 Author

**ZacksBroDev**

- GitHub: [@ZacksBroDev](https://github.com/ZacksBroDev)
- Project: [BlackJack Trainer](https://github.com/ZacksBroDev/BlackJack)

## 🙏 Acknowledgments

- Basic strategy derived from mathematical analysis by Edward O. Thorp and others
- Hi-Lo counting system developed by Harvey Dubner and refined by Stanford Wong
- Illustrious 18 index plays identified by Don Schlesinger
- Card counting principles from "Beat the Dealer" and professional blackjack literature

---

**Disclaimer**: This trainer is for educational purposes only. Card counting is a legal strategy but casinos may refuse service to skilled players. Always gamble responsibly and within your means.

**Note**: This is a learning tool, not real gambling. No real money is involved.
