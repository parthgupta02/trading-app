import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import { useMobile } from '../hooks/useMobile';

export const MainLayout = () => {
    const isMobile = useMobile();

    return isMobile ? <MobileLayout /> : <DesktopLayout />;
};
