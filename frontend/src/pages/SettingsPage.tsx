
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Edit2, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [localSettings, setLocalSettings] = useState(settings);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setLocalSettings(settings); // Sync local state when global settings change (e.g. initial load)
    }, [settings]);

    const handleChange = (commodity: 'gold' | 'silver', field: 'lotSize' | 'commissionPerLot', value: string) => {
        const numValue = parseFloat(value);
        setLocalSettings(prev => ({
            ...prev,
            [commodity]: {
                ...prev[commodity],
                [field]: isNaN(numValue) ? 0 : numValue
            }
        }));
    };

    const handleSave = async () => {
        try {
            await updateSettings(localSettings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setIsEditing(false);

            // Clear message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Failed to save settings:", error);
            setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#F59E0B] flex items-center gap-2">
                        Trading Settings
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Configure your trading parameters and commissions.</p>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30 border border-[#F59E0B]/50"
                    >
                        <Edit2 size={16} className="mr-2" />
                        Edit Settings
                    </Button>
                )}
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Settings Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gold Settings */}
                <Card className="border-t-4 border-t-[#F59E0B] p-6 space-y-6">
                    <h2 className="text-xl font-bold text-[#F59E0B] border-b border-gray-800 pb-2">Gold Settings</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Mini Lot Size (grams)
                            </label>
                            <Input
                                type="number"
                                value={localSettings.gold.lotSize}
                                onChange={(e) => handleChange('gold', 'lotSize', e.target.value)}
                                disabled={!isEditing}
                                className={!isEditing ? "opacity-70 bg-gray-900 border-transparent" : ""}
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Standard contract size for Gold Mini.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Commission (per lot)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                <Input
                                    type="number"
                                    value={localSettings.gold.commissionPerLot}
                                    onChange={(e) => handleChange('gold', 'commissionPerLot', e.target.value)}
                                    disabled={!isEditing}
                                    className={`pl-8 ${!isEditing ? "opacity-70 bg-gray-900 border-transparent" : ""}`}
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Deducted from profit for each realized lot.</p>
                        </div>
                    </div>
                </Card>

                {/* Silver Settings */}
                <Card className="border-t-4 border-t-gray-400 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-gray-300 border-b border-gray-800 pb-2">Silver Settings</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Mini Lot Size (kg)
                            </label>
                            <Input
                                type="number"
                                value={localSettings.silver.lotSize}
                                onChange={(e) => handleChange('silver', 'lotSize', e.target.value)}
                                disabled={!isEditing}
                                className={!isEditing ? "opacity-70 bg-gray-900 border-transparent" : ""}
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Standard contract size for Silver Mini.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Commission (per lot)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                <Input
                                    type="number"
                                    value={localSettings.silver.commissionPerLot}
                                    onChange={(e) => handleChange('silver', 'commissionPerLot', e.target.value)}
                                    disabled={!isEditing}
                                    className={`pl-8 ${!isEditing ? "opacity-70 bg-gray-900 border-transparent" : ""}`}
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Deducted from profit for each realized lot.</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setLocalSettings(settings); // Reset to saved settings
                            setIsEditing(false);
                            setMessage(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-[#F59E0B] text-black hover:bg-[#D97706]"
                    >
                        <Save size={16} className="mr-2" />
                        Save Settings
                    </Button>
                </div>
            )}

            {/* How to Use Section */}
            <Card className="bg-gray-900/50 border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-gray-200 mb-3 block border-b border-gray-800 pb-2">
                    How to configure settings
                </h3>
                <div className="space-y-3 text-sm text-gray-400">
                    <p>
                        <strong className="text-gray-300">Lot Sizes:</strong> Define the quantity multiplier for your contracts.
                        Usually 100g for Gold Mini and 5kg for Silver Mini.
                        <br />
                        <span className="text-xs text-gray-600 italic">(Note: Currently P&L logic uses hardcoded multipliers 10/5. Future update will use these inputs effectively if logic changes.)</span>
                    </p>
                    <p>
                        <strong className="text-gray-300">Commissions:</strong> Enter the commission amount you pay per individual lot.
                        This value is automatically deducted from your Gross P&L to show your Net Realized Profit.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-gray-500">
                        <li>Click <span className="text-[#F59E0B]">Edit Settings</span> to modify values.</li>
                        <li>Changes apply to <strong className="text-gray-400">NEW</strong> P&L calculations immediately.</li>
                        <li>Existing P&L numbers in reports will recalculate based on these new settings.</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};
