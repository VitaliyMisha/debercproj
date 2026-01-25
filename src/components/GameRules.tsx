import React from 'react';
import { Settings, HelpCircle } from 'lucide-react';

export interface GameRulesConfig {
    secondBPenalty: number;
    hvPenalty: number;
    allowVis: boolean;
    customTargetScore: boolean;
    targetScoreOptions: number[];
}

interface GameRulesProps {
    rules: GameRulesConfig;
    onRulesChange: (rules: GameRulesConfig) => void;
}

const GameRules: React.FC<GameRulesProps> = ({ rules, onRulesChange }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleChange = (key: keyof GameRulesConfig, value: any) => {
        onRulesChange({
            ...rules,
            [key]: value
        });
    };

    const addTargetScoreOption = () => {
        const newScore = prompt('Введіть новий цільовий рахунок:');
        if (newScore && !isNaN(Number(newScore)) && Number(newScore) > 0) {
            const score = Number(newScore);
            if (!rules.targetScoreOptions.includes(score)) {
                handleChange('targetScoreOptions', [...rules.targetScoreOptions, score].sort((a, b) => a - b));
            }
        }
    };

    const removeTargetScoreOption = (score: number) => {
        if (rules.targetScoreOptions.length > 1) {
            handleChange('targetScoreOptions', rules.targetScoreOptions.filter(s => s !== score));
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mt-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-linear-to-r from-purple-500 to-pink-600 px-6 py-4 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-200"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Налаштування правил
                    </h3>
                    <svg
                        className={`w-5 h-5 text-white transition-transform duration-200 ${
                            isExpanded ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-200 opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}>
                <div className="p-6 space-y-6">
                    {/* Штраф за другу Б */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <span>💣</span>
                            Штраф за другу "Б"
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="-200"
                                max="0"
                                step="10"
                                value={rules.secondBPenalty}
                                onChange={(e) => handleChange('secondBPenalty', Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="w-16 text-center font-bold text-red-600">
                                {rules.secondBPenalty}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            Кількість очок, які втрачає гравець за другу "Б"
                        </p>
                    </div>

                    {/* Штраф за ХВ */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <span>📉</span>
                            Штраф за "ХВ"
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="-200"
                                max="0"
                                step="10"
                                value={rules.hvPenalty}
                                onChange={(e) => handleChange('hvPenalty', Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="w-16 text-center font-bold text-red-600">
                                {rules.hvPenalty}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            Кількість очок, які втрачає гравець за "ХВ"
                        </p>
                    </div>

                    {/* Дозволити ВІС */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <span>🎯</span>
                            Правило "ВІС"
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rules.allowVis}
                                    onChange={(e) => handleChange('allowVis', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                <span className="ml-3 text-gray-700">
                                    {rules.allowVis ? 'Дозволено' : 'Заборонено'}
                                </span>
                            </label>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            Дозволити гравцям використовувати правило "ВІС"
                        </p>
                    </div>

                    {/* Користувацькі цільові рахунки */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <span>🏆</span>
                            Користувацькі цільові рахунки
                        </label>
                        <div className="flex items-center gap-4 mb-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rules.customTargetScore}
                                    onChange={(e) => handleChange('customTargetScore', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                <span className="ml-3 text-gray-700">
                                    {rules.customTargetScore ? 'Увімкнено' : 'Вимкнено'}
                                </span>
                            </label>
                        </div>

                        {rules.customTargetScore && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {rules.targetScoreOptions.map(score => (
                                        <div key={score} className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                            <span className="font-medium">{score}</span>
                                            {rules.targetScoreOptions.length > 1 && (
                                                <button
                                                    onClick={() => removeTargetScoreOption(score)}
                                                    className="ml-1 text-purple-500 hover:text-purple-700"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addTargetScoreOption}
                                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                                >
                                    + Додати рахунок
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Зведення правил */}
                    <div className="mt-6 p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Поточні правила:</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                            <li>• Друга "Б": <span className="font-semibold text-red-600">{rules.secondBPenalty} очок</span></li>
                            <li>• "ХВ": <span className="font-semibold text-red-600">{rules.hvPenalty} очок</span></li>
                            <li>• Правило "ВІС": <span className="font-semibold">{rules.allowVis ? 'Дозволено' : 'Заборонено'}</span></li>
                            <li>• Доступні цільові рахунки: <span className="font-semibold">{rules.targetScoreOptions.join(', ')}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameRules;