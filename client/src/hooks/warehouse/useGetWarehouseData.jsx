import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/userSlice';
import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseconfig';
const items = [
  {
      "warehouseId": "53swRgHW-61hnDCFy_rIf"
  },
  {
      "warehouseId": "53swRgHW-61hnDCFy_rIf",
      "shelfId": "7W2jXNB2NyxxUXZ6QCdGN",
      "rowShelfId": "dYELrOH0x8Yuh11dteBAr",
      "segmentId": "O8P727_nkw2_B8WFCZ8hk"
  },
  {
      "warehouseId": "VHQn9ErkMcFUetarA8mpa"
  },
  {
      "warehouseId": "NFtgFE2jA84sDQNew89Su"
  },
  {
      "warehouseId": "53swRgHW-61hnDCFy_rIf",
      "shelfId": "7W2jXNB2NyxxUXZ6QCdGN"
  },
  {
      "warehouseId": "53swRgHW-61hnDCFy_rIf",
      "shelfId": "7W2jXNB2NyxxUXZ6QCdGN",
      "rowShelfId": "dYELrOH0x8Yuh11dteBAr"
  },
  {
      "warehouseId": "Uds1FvnWTRbEiZP4diPuM"
  }
]
export const useGetWarehouseData = () => {
  const user = useSelector(selectUser);
  const memoizedUser = useMemo(() => user, [user]);
  const memorizedItems = useMemo(() => items, [items]);

  const [data, setData] = useState({
    warehouses: [],
    shelves: [],
    rows: [],
    segments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (user, items) => {
    if (!user.businessID || items.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    let warehouses = [];
    let shelves = [];
    let rows = [];
    let segments = [];

    for (const item of items) {
      try {
        let docPath = `businesses/${user.businessID}/warehouses/${item.warehouseId}`;
        
        if (item.shelfId) {
          docPath += `/shelves/${item.shelfId}`;
          if (item.rowShelfId) {
            docPath += `/rows/${item.rowShelfId}`;
            if (item.segmentId) {
              docPath += `/segments/${item.segmentId}`;
            }
          }
        }

        const docRef = doc(db, docPath);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          if (item.segmentId) segments.push(docData);
          else if (item.rowShelfId) rows.push(docData);
          else if (item.shelfId) shelves.push(docData);
          else if (item.warehouseId) warehouses.push(docData);
        }
      } catch (error) {
        console.error("Error obteniendo el documento:", error);
        setError(error);
      }
    }

    setData({
      warehouses,
      shelves,
      rows,
      segments,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData(memoizedUser, items);
  }, [memoizedUser, memorizedItems]);

  return { data, loading, error };
};
