import { faEdit, faMapMarkerAlt, faPhone, faIdCard, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Tooltip } from 'antd'
import { DateTime } from "luxon"
import { useMemo } from "react"
import styled from "styled-components"

export const BusinessCard = ({ business, onEditBusiness }) => {
    // Función para formatear el tiempo transcurrido desde la creación
    const formatTimeAgo = (createdAt) => {
        if (!createdAt) return "Fecha no disponible";
        
        const now = DateTime.now();
        const created = createdAt.seconds ? 
            DateTime.fromSeconds(createdAt.seconds) : 
            DateTime.fromISO(createdAt);
        
        if (!created.isValid) return "Fecha no válida";
        
        const diff = now.diff(created, ['years', 'months', 'days', 'hours', 'minutes', 'seconds']).toObject();
        
        if (diff.years > 0) {
            return `Desde hace ${diff.years} ${diff.years === 1 ? 'año' : 'años'}${
                diff.months > 0 ? ` y ${diff.months} ${diff.months === 1 ? 'mes' : 'meses'}` : ''
            }`;
        } else if (diff.months > 0) {
            return `Desde hace ${diff.months} ${diff.months === 1 ? 'mes' : 'meses'}${
                diff.days > 0 ? ` y ${Math.floor(diff.days)} ${Math.floor(diff.days) === 1 ? 'día' : 'días'}` : ''
            }`;
        } else if (diff.days > 6) {
            return `Desde hace ${Math.floor(diff.days / 7)} semanas`;
        } else if (diff.days > 0) {
            return `Desde hace ${Math.floor(diff.days)} ${Math.floor(diff.days) === 1 ? 'día' : 'días'}`;
        } else if (diff.hours > 0) {
            return `Desde hace ${Math.floor(diff.hours)} ${Math.floor(diff.hours) === 1 ? 'hora' : 'horas'}${
                diff.minutes > 0 ? ` y ${Math.floor(diff.minutes)} ${Math.floor(diff.minutes) === 1 ? 'minuto' : 'minutos'}` : ''
            }`;
        } else if (diff.minutes > 0) {
            return `Desde hace ${Math.floor(diff.minutes)} ${Math.floor(diff.minutes) === 1 ? 'minuto' : 'minutos'}${
                diff.seconds > 0 ? ` y ${Math.floor(diff.seconds)} ${Math.floor(diff.seconds) === 1 ? 'segundo' : 'segundos'}` : ''
            }`;
        } else if (diff.seconds > 0) {
            return `Desde hace ${Math.floor(diff.seconds)} ${Math.floor(diff.seconds) === 1 ? 'segundo' : 'segundos'}`;
        } else {
            return "Creado justo ahora";
        }
    };

    const businessData = useMemo(() => ({
        address: business.address || "Sin dirección proporcionada",
        tel: business.tel || "Sin teléfono registrado",
        name: business.name || "Negocio sin nombre",
        id: business.id || "ID no disponible",
        createdAt: business.createdAt,
        timeAgo: formatTimeAgo(business.createdAt)
      }), [business]);
      
    const openModal = (e) => {
        e.stopPropagation();
        onEditBusiness(business);
    }
      const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(e);
          }
      };

    return (
        <StyledCard onClick={openModal} onKeyDown={handleKeyDown} role="button" tabIndex={0}>            <Head>
                <Tooltip title={businessData.name} placement="top">
                    <BusinessName>
                        {businessData.name}
                    </BusinessName>
                </Tooltip>                <EditIcon><FontAwesomeIcon icon={faEdit} /></EditIcon>
            </Head>            <Body>
                <InfoItem>
                    <IconWrapper><FontAwesomeIcon icon={faIdCard} /></IconWrapper> <span>{businessData.id}</span>
                </InfoItem>
                <InfoItem>
                    <IconWrapper><FontAwesomeIcon icon={faMapMarkerAlt} /></IconWrapper> <span>{businessData.address}</span>
                </InfoItem>
                <InfoItem>
                    <IconWrapper><FontAwesomeIcon icon={faPhone} /></IconWrapper> <span>{businessData.tel}</span>
                </InfoItem>
                <InfoItem className="time-ago-item">
                    <IconWrapper><FontAwesomeIcon icon={faCalendarAlt} /></IconWrapper> <span>{businessData.timeAgo}</span>
                </InfoItem>
            </Body>
        </StyledCard>
    )
}

const StyledCard = styled.div`
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e8e8e8);
    border-radius: 6px;
    background-color: #ffffff;
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
`

const Head = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border, #f0f0f0);
`

const BusinessName = styled.div`
    color: var(--color-text-primary, #262626);
    font-size: 1rem;
    font-weight: 600;
    margin-right: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1; /* Toma todo el espacio disponible */
    position: relative;
    line-height: normal; /* Mantiene todo en una línea */
    
    &:hover::before {
        content: attr(data-tooltip);
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.85rem;
        white-space: nowrap;
        z-index: 100;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
    }
`

const EditIcon = styled.span`
    color: var(--color-primary, #1890ff);
    opacity: 0.7;
    transition: opacity 0.2s ease;
    padding: 4px;

    &:hover {
        opacity: 1;
    }
`

const Body = styled.div`
    display: grid;

    gap: 0.5rem;
`

const IconWrapper = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.4em;
    height: 1.4em;
    flex-shrink: 0;
`

const InfoItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--color-text-secondary, #595959);
    font-size: 0.85rem;
    min-width: 0;
    overflow: hidden;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    svg {
        flex-shrink: 0;
        font-size: 0.9rem;
        color: var(--color-text-secondary, #8c8c8c);
    }
`
