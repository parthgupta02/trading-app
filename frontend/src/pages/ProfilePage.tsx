import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const ProfilePage = () => {
    const { currentUser, logout, extractMobileFromEmail, deleteAccount } = useAuth();
    const { profile, APP_ID } = useData();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleClearData = async () => {
        if (!currentUser) return;
        setIsDeleting(true);
        try {
            const tradesRef = collection(db, `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`);
            const snapshot = await getDocs(tradesRef);
            const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`, docSnap.id)));
            await Promise.all(deletePromises);
            setIsDeleteModalOpen(false);
            // Optional: Show success toast
        } catch (error) {
            console.error("Error clearing data:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!currentUser) return;
        setIsDeleting(true);
        try {
            await deleteAccount();
            setIsDeleteAccountModalOpen(false);
        } catch (error) {
            console.error("Error deleting account:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <Card className="border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">User Profile</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Full Name</label>
                        <p className="text-lg text-white font-semibold">{profile.fullName || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Mobile Number</label>
                        <p className="text-lg text-white font-mono">{extractMobileFromEmail(currentUser?.email || '')}</p>
                    </div>
                    <div className="pt-4">
                        <Button onClick={handleLogout} variant="secondary" className="w-full sm:w-auto">
                            Sign Out
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="border-red-900 bg-gray-900 bg-opacity-50">
                <h3 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h3>
                <p className="text-gray-400 mb-6 text-sm">
                    Once you delete your data, there is no going back. Please be certain.
                </p>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Button onClick={() => setIsDeleteModalOpen(true)} variant="danger">
                        Clear All Trade Data
                    </Button>
                    <Button onClick={() => setIsDeleteAccountModalOpen(true)} variant="danger" className="bg-red-900/50 hover:bg-red-900 border-red-800">
                        Delete Account
                    </Button>
                </div>
            </Card>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Data Deletion"
            >
                <p className="mb-4 text-gray-300">
                    Are you essentially sure you want to delete ALL your trade history? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-end mt-6">
                    <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleClearData} loading={isDeleting}>
                        Yes, Delete Everything
                    </Button>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
                title="Delete Account"
            >
                <div className="space-y-4">
                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                        <p className="text-red-400 font-medium mb-2">Warning: This action is permanent!</p>
                        <p className="text-gray-300 text-sm">
                            Deleting your account will permanently remove:
                        </p>
                        <ul className="list-disc list-inside text-gray-400 text-sm mt-2 ml-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All trade history and performance data</li>
                            <li>Active subscriptions</li>
                        </ul>
                    </div>

                    <p className="text-gray-300">
                        Are you sure you want to proceed?
                    </p>

                    <div className="flex space-x-3 justify-end mt-6">
                        <Button variant="secondary" onClick={() => setIsDeleteAccountModalOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteAccount} loading={isDeleting}>
                            Yes, Delete Account
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
