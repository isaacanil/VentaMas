import { TbPlus } from "react-icons/tb"
import { Button } from "../../../../../templates/system/Button/Button"
import { Tooltip } from "../../../../../templates/system/Button/Tooltip"
import { useSelector } from "react-redux"
import { SelectProductSelected } from "../../../../../../features/productOutflow/productOutflow"


export const tableHeaderColumns = ({Group }) => {
    const productSelected = useSelector(SelectProductSelected)
    const currentQuantity = () => {
        const removed = productSelected?.currentRemovedQuantity;
        const stock = productSelected?.product?.stock ;
        stock - removed;
        if(typeof (stock && removed) !== 'number'){
            return 0
        }
        return stock - removed
    };
    return ([
        {
            width: "1fr ",
            subtitle: 'Producto',
            render: (subtitle) => (
                <Group>
                    <span>{subtitle}</span>
                </Group>
            )
        },
        {
            width: "0.8fr",
            subtitle: `Cantidad ${`(${currentQuantity()})`}`,
            render: (subtitle) => (
                <span>{subtitle}</span>
            )
        },
        {
            width: " 0.8fr ",
            subtitle: 'Motivo',
            render: (subtitle) => (
                <Group>
                    <span>{subtitle}</span>
                    <Button
                        borderRadius={'normal'}
                        title={<TbPlus />}
                    />
                </Group>
            )
        },
        {
            width: "0.8fr",
            subtitle: 'Observaciones',
            render: (subtitle) => (
                <span>{subtitle}</span>
            )
        },
        {
            width: "min-content",
            subtitle: '',
            render: () => (
                <div></div>
            )
        }
    ])
}