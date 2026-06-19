import { h } from '@dropins/tools/preact.js';
import {
  useCallback,
  useMemo,
  useState,
} from '@dropins/tools/preact-compat.js';
import { events } from '@dropins/tools/event-bus.js';
import {
  Button,
  Card,
  Icon,
  InLineAlert,
} from '@dropins/tools/components.js';
import { useText } from '@dropins/tools/i18n.js';
import { fetchGraphQl } from '@dropins/storefront-requisition-list/api.js';
import {
  R as REQUISITION_LIST_FRAGMENT,
  a as REQUISITION_LIST_ITEMS_FRAGMENT,
  t as transformRequisitionList,
} from '@dropins/storefront-requisition-list/chunks/updateRequisitionList.js';
import {
  R as RequisitionListPicker,
  u as useRequisitionLists,
} from '@dropins/storefront-requisition-list/chunks/RequisitionListPicker.js';
import {
  E as EmptyList,
  S as ListIcon,
  a as useRequisitionListAlert,
  u as useRequisitionListEnabled,
} from '@dropins/storefront-requisition-list/chunks/RequisitionListView.js';
import {
  R as RequisitionListActions,
} from '@dropins/storefront-requisition-list/chunks/RequisitionListActions.js';
import {
  R as RequisitionListModal,
} from '@dropins/storefront-requisition-list/chunks/RequisitionListModal.js';
import {
  RequisitionListForm,
} from '@dropins/storefront-requisition-list/containers/RequisitionListForm.js';

const ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION = `
  mutation ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION(
      $requisitionListUid: ID!,
      $requisitionListItems: [RequisitionListItemsInput!]!
    ) {
    addProductsToRequisitionList(
      requisitionListUid: $requisitionListUid
      requisitionListItems: $requisitionListItems
    ) {
      requisition_list {
        ...REQUISITION_LIST_FRAGMENT
        items {
          ...REQUISITION_LIST_ITEMS_FRAGMENT
        }
      }
    }
  }
${REQUISITION_LIST_ITEMS_FRAGMENT}
${REQUISITION_LIST_FRAGMENT}
`;

function ChevronDownIcon(props) {
  return h('svg', {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    ...props,
  }, h('path', {
    vectorEffect: 'non-scaling-stroke',
    d: 'M7.74512 9.87701L12.0001 14.132L16.2551 9.87701',
    stroke: 'currentColor',
    strokeWidth: 1,
    strokeLinecap: 'square',
    strokeLinejoin: 'round',
  }));
}

function isMatchingRequisitionListItem(requisitionListItem, product, options = {}) {
  const itemSku = requisitionListItem.sku ?? requisitionListItem.product?.sku;
  if (!itemSku || itemSku !== product.sku) {
    return false;
  }

  if (options.matchBySkuOnly !== false) {
    return true;
  }

  const itemOptionUids = (requisitionListItem.configurable_options ?? [])
    .map((option) => option.value_uid)
    .filter(Boolean);
  const productOptionUids = (product.selectedOptions ?? []).filter(Boolean);

  if (itemOptionUids.length !== productOptionUids.length) {
    return false;
  }

  itemOptionUids.sort();
  productOptionUids.sort();

  return itemOptionUids.every((uid, index) => uid === productOptionUids[index]);
}

async function addProductsToRequisitionList(requisitionListUid, requisitionListItems) {
  const cleanedItems = requisitionListItems.map((item) => {
    const cleaned = {
      sku: item.sku,
      quantity: item.quantity,
    };

    if (item.parent_sku) cleaned.parent_sku = item.parent_sku;
    if (item.selected_options?.length > 0) cleaned.selected_options = item.selected_options;
    if (item.entered_options?.length > 0) cleaned.entered_options = item.entered_options;

    return cleaned;
  });

  const { errors, data } = await fetchGraphQl(
    ADD_PRODUCTS_TO_REQUISITION_LIST_MUTATION,
    {
      variables: {
        requisitionListUid,
        requisitionListItems: cleanedItems,
      },
    },
  );

  if (errors?.length > 0) {
    throw new Error(errors.map((error) => error?.message).filter(Boolean).join('. '));
  }

  const requisitionList = data?.addProductsToRequisitionList?.requisition_list;
  if (!requisitionList) {
    return null;
  }

  const payload = transformRequisitionList(requisitionList);
  events.emit('requisitionList/data', payload);
  return payload;
}

export function RequisitionListSelector({
  canCreate = true,
  sku,
  selectedOptions,
  enteredOptions,
  quantity = 1,
  matchBySKU,
  beforeAddProdToReqList,
}) {
  const translations = useText({
    createTitle: 'RequisitionList.RequisitionListForm.createTitle',
    addToRequisitionList: 'RequisitionList.RequisitionListForm.addToRequisitionList',
    emptyList: 'RequisitionList.RequisitionListWrapper.emptyList',
    addToSelected: 'RequisitionList.RequisitionListSelector.addToSelected',
  });
  const [isAdding, setIsAdding] = useState(false);
  const { lists } = useRequisitionLists();
  const { isEnabled } = useRequisitionListEnabled();
  const { alert, setAlert, handleRequisitionListAlert } = useRequisitionListAlert();
  const [modal, setModal] = useState({ isOpen: false, isLoading: false });

  const isInRequisitionList = useMemo(() => {
    if (!lists?.length) {
      return false;
    }

    const productContext = { sku, selectedOptions };
    return lists.some((list) => list.items?.some((item) => (
      isMatchingRequisitionListItem(item, productContext, { matchBySkuOnly: matchBySKU })
    )));
  }, [lists, sku, selectedOptions, matchBySKU]);

  const handleOpenModal = useCallback(() => {
    setModal({ isOpen: true, isLoading: false });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModal({ isOpen: false, isLoading: false });
    setIsAdding(false);
    setAlert(null);
  }, [setAlert]);

  const handleAddProdToReqList = useCallback(async (requisitionListUid) => {
    const itemToAdd = {
      sku,
      quantity,
      ...(selectedOptions?.length > 0 ? { selected_options: selectedOptions } : {}),
      ...(enteredOptions?.length > 0 ? { entered_options: enteredOptions } : {}),
    };

    await addProductsToRequisitionList(requisitionListUid, [itemToAdd]);
  }, [sku, quantity, selectedOptions, enteredOptions]);

  const handleAddProductAndEmitAlert = useCallback(async (requisitionListUid) => {
    try {
      await handleAddProdToReqList(requisitionListUid);
      handleRequisitionListAlert({
        action: 'add',
        type: 'success',
        context: 'product',
        skus: [sku],
      });
    } catch (error) {
      console.error('Error adding product to list:', error);
      handleRequisitionListAlert({
        action: 'add',
        type: 'error',
        context: 'product',
        skus: [sku],
      });
    } finally {
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    }
  }, [sku, handleAddProdToReqList, handleCloseModal, handleRequisitionListAlert]);

  const handleOpenModalWithValidation = useCallback(() => {
    if (!beforeAddProdToReqList) {
      handleOpenModal();
      return;
    }

    Promise.resolve(beforeAddProdToReqList())
      .then(() => {
        handleOpenModal();
      })
      .catch(() => {});
  }, [beforeAddProdToReqList, handleOpenModal]);

  let selectReqListSection = h(EmptyList, { textContent: translations.emptyList });
  if (lists?.length > 0) {
    selectReqListSection = isAdding
      ? h('button', {
        type: 'button',
        'aria-label': 'Select a requisition list',
        role: 'button',
        className: 'requisition-list-actions',
        'data-testid': 'requisition-list-actions-button',
        onClick: () => setIsAdding(false),
      }, [
        h('span', {
          className: 'requisition-list-actions__title',
          'data-testid': 'requisition-list-actions-button-text',
        }, translations.addToRequisitionList),
        h(Icon, { source: ChevronDownIcon, size: '32' }),
      ])
      : h(RequisitionListPicker, {
        confirmLabel: translations.addToSelected,
        onConfirm: handleAddProductAndEmitAlert,
      });
  }

  const createReqListSection = !isAdding
    ? h(RequisitionListActions, {
      onAddNew: () => {
        setIsAdding(true);
      },
    })
    : h(Card, {
      variant: 'secondary',
    }, h(RequisitionListForm, {
      mode: 'create',
      onSuccess: async (newList) => {
        await handleAddProductAndEmitAlert(newList.uid);
      },
      onError: () => {
        handleRequisitionListAlert({
          action: 'add',
          type: 'error',
          context: 'product',
          skus: [sku],
        });
      },
      onCancel: () => {
        setIsAdding(false);
      },
    }));

  const modalContent = [
    alert && h('div', {
      className: 'requisition-list__alert-wrapper',
    }, h(InLineAlert, {
      id: `requisition-list-selector__alert__${sku}`,
      heading: alert.description,
      type: alert.type,
      variant: 'primary',
      className: 'requisition-list-selector__alert',
    })),
    !alert && [
      selectReqListSection,
      canCreate && createReqListSection,
    ],
  ];

  if (isEnabled === null || !isEnabled) {
    return null;
  }

  return h('div', {
    className: 'requisition-list-selector',
  }, [
    h(Button, {
      active: isInRequisitionList,
      activeIcon: h(Icon, { source: ListIcon }),
      'aria-label': translations.addToRequisitionList,
      className: isInRequisitionList ? 'requisition-list-selector--active' : undefined,
      'data-testid': 'requisition-list-selector',
      size: 'medium',
      variant: 'tertiary',
      icon: h(Icon, { source: ListIcon }),
      onClick: handleOpenModalWithValidation,
    }),
    modal.isOpen && h(RequisitionListModal, {
      isOpen: true,
      isLoading: modal.isLoading,
      title: translations.addToRequisitionList,
      modalContent,
      handleModalOnClose: handleCloseModal,
    }),
  ]);
}

export default RequisitionListSelector;
